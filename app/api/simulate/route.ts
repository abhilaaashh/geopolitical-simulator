import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { promises as fs } from 'fs';
import path from 'path';
import type { SimulateActionRequest, SimulationResponse, GameEvent } from '@/lib/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ 
  model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
  },
});

async function getPromptTemplate(name: string): Promise<string> {
  const promptPath = path.join(process.cwd(), 'resources', 'prompts', `${name}.txt`);
  return fs.readFile(promptPath, 'utf-8');
}

export async function POST(request: NextRequest) {
  try {
    const body: SimulateActionRequest = await request.json();
    const { gameState, playerAction } = body;

    if (!gameState || !playerAction) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { scenario, playerActorId, currentTurn, events, worldState, playerGoal } = gameState;

    if (!scenario) {
      return NextResponse.json({ error: 'No scenario loaded' }, { status: 400 });
    }

    const playerActor = scenario.actors.find(a => a.id === playerActorId);
    if (!playerActor) {
      return NextResponse.json({ error: 'Player actor not found' }, { status: 400 });
    }

    // Get simulation prompt template
    let systemPrompt = await getPromptTemplate('simulate-turn');

    // Format actors list with safeguards
    const actorsList = (scenario.actors || []).map(a => {
      const rawObjectives = a.objectives;
      const objectives = Array.isArray(rawObjectives) && rawObjectives.length > 0 
        ? rawObjectives.join(', ') 
        : 'Unknown';
      return `- ${a.name} (${a.type}): ${a.description || 'No description'}\n  Objectives: ${objectives}\n  Personality: ${a.personality || 'Unknown'}`;
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
      .replace('{{PLAYER_ACTOR_NAME}}', playerActor.name || 'Player')
      .replace('{{PLAYER_ACTION}}', playerAction)
      .replace('{{PLAYER_GOAL}}', playerGoalDescription)
      .replace('{{GOAL_PROGRESS}}', String(currentGoalProgress))
      .replace('{{RECENT_EVENTS}}', recentEvents || 'Game just started');

    const userMessage = `The player (${playerActor.name}) takes the following action:\n\n"${playerAction}"\n\nSimulate the world's response.`;
    const fullPrompt = `${systemPrompt}\n\n${userMessage}`;
    
    const result = await model.generateContent(fullPrompt);
    const content = result.response.text();
    if (!content) {
      throw new Error('No content in response');
    }

    const simulation: SimulationResponse = JSON.parse(content);

    // Ensure events have proper structure
    simulation.events = (simulation.events || []).map(event => ({
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      turn: currentTurn,
      sentiment: event.sentiment || 'neutral',
    }));

    // Calculate new tension level (clamp between 0-100)
    if (simulation.worldStateUpdate?.tensionLevel !== undefined) {
      const currentTension = worldState?.tensionLevel ?? 50;
      const change = simulation.worldStateUpdate.tensionLevel;
      
      // If it's a relative change (small number), add to current
      // If it's an absolute value (larger number), use as-is
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

    return NextResponse.json(simulation);
  } catch (error) {
    console.error('Simulation error:', error);
    return NextResponse.json(
      { error: 'Failed to simulate turn' },
      { status: 500 }
    );
  }
}
