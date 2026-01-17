import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { promises as fs } from 'fs';
import path from 'path';
import type { GameState, SimulationResponse } from '@/lib/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Non-streaming model for fallback
const model = genAI.getGenerativeModel({ 
  model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
  },
});

// Streaming model
const streamingModel = genAI.getGenerativeModel({ 
  model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
});

interface SkipTurnRequest {
  gameState: GameState;
}

async function getPromptTemplate(name: string): Promise<string> {
  const promptPath = path.join(process.cwd(), 'resources', 'prompts', `${name}.txt`);
  return fs.readFile(promptPath, 'utf-8');
}

/**
 * Extract JSON from a string that might contain markdown code blocks
 */
function extractJSON(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

/**
 * Process skip turn simulation response
 */
function processSimulation(simulation: SimulationResponse, currentTurn: number, worldState: any, playerActorId: string): SimulationResponse {
  // Ensure events have proper structure and filter out any player events (safety check)
  simulation.events = (simulation.events || [])
    .filter(event => event.actorId !== playerActorId)
    .map(event => ({
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      turn: currentTurn,
      sentiment: event.sentiment || 'neutral',
    }));

  // Calculate new tension level (clamp between 0-100)
  // Skip turns have smaller tension changes (-5 to +5)
  if (simulation.worldStateUpdate?.tensionLevel !== undefined) {
    const currentTension = worldState?.tensionLevel ?? 50;
    const change = simulation.worldStateUpdate.tensionLevel;
    
    if (Math.abs(change) <= 20) {
      simulation.worldStateUpdate.tensionLevel = Math.max(0, Math.min(100, currentTension + change));
    } else {
      simulation.worldStateUpdate.tensionLevel = Math.max(0, Math.min(100, change));
    }
  }

  // Ensure goal progress is clamped between 0-100
  if (simulation.goalProgressUpdate?.progress !== undefined) {
    simulation.goalProgressUpdate.progress = Math.max(0, Math.min(100, simulation.goalProgressUpdate.progress));
  }

  return simulation;
}

/**
 * Build the prompt for skip turn
 */
async function buildPrompt(gameState: GameState, playerActor: any): Promise<string> {
  const { scenario, playerActorId, currentTurn, events, worldState, playerGoal } = gameState;
  
  if (!scenario) throw new Error('No scenario');
  
  let systemPrompt = await getPromptTemplate('skip-turn');

  // Format actors list (excluding player for autonomous events)
  const actorsList = (scenario.actors || []).map(a => {
    const rawObjectives = a.objectives;
    const objectives = Array.isArray(rawObjectives) && rawObjectives.length > 0 
      ? rawObjectives.join(', ') 
      : 'Unknown';
    const isPlayer = a.id === playerActorId ? ' [PLAYER - DO NOT GENERATE EVENTS FOR]' : '';
    return `- ${a.name} (${a.type})${isPlayer}: ${a.description || 'No description'}\n  Objectives: ${objectives}\n  Personality: ${a.personality || 'Unknown'}`;
  }).join('\n\n');

  // Get recent events (last 5) with safeguards
  const safeEvents = events || [];
  const recentEvents = safeEvents.slice(-5).map(e => 
    `[Turn ${e.turn ?? 1}] ${e.actorName || 'Unknown'}: ${e.content || ''}`
  ).join('\n');

  // Safeguard worldState values
  const tensionLevel = worldState?.tensionLevel ?? 50;
  const globalSentiment = worldState?.globalSentiment || 'Neutral';
  const rawConflicts = worldState?.activeConflicts;
  const activeConflicts = Array.isArray(rawConflicts) ? rawConflicts : [];
  const diplomaticStatus = worldState?.diplomaticStatus || 'Stable';

  // Player goal context
  const playerGoalDescription = playerGoal?.description || 'No specific goal set';
  const currentGoalProgress = playerGoal?.progress ?? 0;

  // Replace template variables
  systemPrompt = systemPrompt
    .replace('{{SCENARIO_TITLE}}', scenario.title || 'Untitled Scenario')
    .replace('{{SCENARIO_CONTEXT}}', scenario.backgroundContext || 'No background context available')
    .replace('{{TURN_NUMBER}}', String(currentTurn || 1))
    .replace('{{TENSION_LEVEL}}', String(tensionLevel))
    .replace('{{GLOBAL_SENTIMENT}}', globalSentiment)
    .replace('{{ACTIVE_CONFLICTS}}', activeConflicts.length > 0 ? activeConflicts.join(', ') : 'None')
    .replace('{{DIPLOMATIC_STATUS}}', diplomaticStatus)
    .replace('{{ACTORS_LIST}}', actorsList || 'No actors defined')
    .replace(/\{\{PLAYER_ACTOR_NAME\}\}/g, playerActor.name || 'Player')
    .replace(/\{\{PLAYER_ACTOR_ID\}\}/g, playerActorId || 'unknown')
    .replace('{{PLAYER_GOAL}}', playerGoalDescription)
    .replace('{{GOAL_PROGRESS}}', String(currentGoalProgress))
    .replace('{{RECENT_EVENTS}}', recentEvents || 'Game just started');

  const userMessage = `The player (${playerActor.name}) has chosen to observe this turn without taking action. Simulate what happens in the world while they watch. IMPORTANT: Return ONLY valid JSON, no markdown code blocks.`;
  return `${systemPrompt}\n\n${userMessage}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: SkipTurnRequest = await request.json();
    const { gameState } = body;
    
    // Check if client wants streaming
    const acceptHeader = request.headers.get('accept') || '';
    const wantsStream = acceptHeader.includes('text/event-stream');

    if (!gameState) {
      return NextResponse.json({ error: 'Missing game state' }, { status: 400 });
    }

    const { scenario, playerActorId, currentTurn, worldState } = gameState;

    if (!scenario) {
      return NextResponse.json({ error: 'No scenario loaded' }, { status: 400 });
    }

    const playerActor = scenario.actors.find(a => a.id === playerActorId);
    if (!playerActor) {
      return NextResponse.json({ error: 'Player actor not found' }, { status: 400 });
    }

    const fullPrompt = await buildPrompt(gameState, playerActor);

    // Streaming response
    if (wantsStream) {
      const encoder = new TextEncoder();
      
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Step 1: Observing
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'progress', 
              step: 'observing',
              stepIndex: 0,
              totalSteps: 3,
              message: 'Observing world events...',
              progress: 10
            })}\n\n`));

            const result = await streamingModel.generateContentStream(fullPrompt);
            let fullText = '';
            let chunkCount = 0;

            for await (const chunk of result.stream) {
              const chunkText = chunk.text();
              fullText += chunkText;
              chunkCount++;

              const progress = Math.min(90, 10 + chunkCount * 4);
              let step = 'events';
              let stepIndex = 1;
              let message = 'World events unfolding...';

              if (progress > 60) {
                step = 'worldstate';
                stepIndex = 2;
                message = 'Updating world state...';
              }

              if (chunkCount % 3 === 0) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  type: 'progress', 
                  step,
                  stepIndex,
                  totalSteps: 3,
                  message,
                  progress
                })}\n\n`));
              }
            }

            const cleanedJson = extractJSON(fullText);
            const simulation: SimulationResponse = JSON.parse(cleanedJson);
            const processed = processSimulation(simulation, currentTurn, worldState, playerActorId || '');

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'complete', 
              data: processed 
            })}\n\n`));

            controller.close();
          } catch (error) {
            console.error('Streaming error:', error);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'error', 
              message: 'Failed to simulate skip turn' 
            })}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming response (fallback)
    const result = await model.generateContent(fullPrompt);
    const content = result.response.text();
    if (!content) {
      throw new Error('No content in response');
    }

    const simulation: SimulationResponse = JSON.parse(content);
    const processed = processSimulation(simulation, currentTurn, worldState, playerActorId || '');

    return NextResponse.json(processed);
  } catch (error) {
    console.error('Skip turn simulation error:', error);
    return NextResponse.json(
      { error: 'Failed to simulate skip turn' },
      { status: 500 }
    );
  }
}
