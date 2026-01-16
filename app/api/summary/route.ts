import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { promises as fs } from 'fs';
import path from 'path';
import type { GameState, GameEvent } from '@/lib/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ 
  model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
});

async function getPromptTemplate(name: string): Promise<string> {
  const promptPath = path.join(process.cwd(), 'resources', 'prompts', `${name}.txt`);
  return fs.readFile(promptPath, 'utf-8');
}

interface SummaryRequest {
  gameState: GameState;
}

// Structured summary response type
export interface BulletinSummary {
  headline: string;
  subheadline: string;
  stats: {
    turns: number;
    tensionStart: number;
    tensionEnd: number;
    tensionDelta: string;
    outcome: string;
  };
  highlights: string[];
  verdict: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SummaryRequest = await request.json();
    const { gameState } = body;

    if (!gameState) {
      return NextResponse.json({ error: 'Missing game state' }, { status: 400 });
    }

    const { scenario, playerActorId, currentTurn, events, worldState } = gameState;

    if (!scenario) {
      return NextResponse.json({ error: 'No scenario loaded' }, { status: 400 });
    }

    if (!events || events.length === 0) {
      return NextResponse.json({ error: 'No events to summarize' }, { status: 400 });
    }

    const playerActor = scenario.actors.find(a => a.id === playerActorId);

    // Get summary prompt template
    let systemPrompt = await getPromptTemplate('generate-summary');

    // Format actors list
    const actorsList = (scenario.actors || []).map(a => {
      const objectives = Array.isArray(a.objectives) && a.objectives.length > 0 
        ? a.objectives.join(', ') 
        : 'Unknown';
      const isPlayer = a.id === playerActorId ? ' [PLAYER]' : '';
      return `- ${a.name}${isPlayer} (${a.type}): ${a.description || 'No description'}\n  Objectives: ${objectives}`;
    }).join('\n\n');

    // Format events list
    const eventsList = events.map((e: GameEvent, index: number) => {
      const playerTag = e.isPlayerAction ? ' [PLAYER ACTION]' : '';
      const typeTag = e.type.toUpperCase();
      return `[Turn ${e.turn ?? 1}] [${typeTag}]${playerTag} ${e.actorName || 'Unknown'}: ${e.content || ''}`;
    }).join('\n\n');

    // Safeguard worldState values
    const tensionLevel = worldState?.tensionLevel ?? 50;
    const globalSentiment = worldState?.globalSentiment || 'Neutral';
    const diplomaticStatus = worldState?.diplomaticStatus || 'Stable';
    
    // Estimate starting tension from first event's world state changes, or use a default
    // We'll use 50 as a reasonable baseline if we don't have historical data
    const startingTension = 50;

    // Replace template variables
    systemPrompt = systemPrompt
      .replace('{{SCENARIO_TITLE}}', scenario.title || 'Untitled Scenario')
      .replace('{{SCENARIO_CONTEXT}}', scenario.backgroundContext || 'No background context available')
      .replace('{{REGION}}', scenario.region || 'Unknown region')
      .replace('{{PLAYER_NAME}}', playerActor?.name || 'Unknown Player')
      .replace('{{PLAYER_TYPE}}', playerActor?.type || 'unknown')
      .replace('{{PLAYER_OBJECTIVES}}', playerActor?.objectives?.join(', ') || 'Unknown objectives')
      .replace('{{TOTAL_TURNS}}', String(currentTurn || 1))
      .replace('{{STARTING_TENSION}}', String(startingTension))
      .replace('{{TENSION_LEVEL}}', String(tensionLevel))
      .replace('{{GLOBAL_SENTIMENT}}', globalSentiment)
      .replace('{{DIPLOMATIC_STATUS}}', diplomaticStatus)
      .replace('{{ACTORS_LIST}}', actorsList || 'No actors defined')
      .replace('{{EVENTS_LIST}}', eventsList || 'No events yet');

    const result = await model.generateContent(systemPrompt);
    const content = result.response.text();
    
    if (!content) {
      throw new Error('No content in response');
    }

    // Parse the JSON response from the AI
    let bulletin: BulletinSummary;
    try {
      // Clean up potential markdown code blocks
      let cleanedContent = content.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.slice(7);
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.slice(3);
      }
      if (cleanedContent.endsWith('```')) {
        cleanedContent = cleanedContent.slice(0, -3);
      }
      cleanedContent = cleanedContent.trim();
      
      bulletin = JSON.parse(cleanedContent);
      
      // Validate required fields
      if (!bulletin.headline || !bulletin.highlights || !bulletin.verdict) {
        throw new Error('Missing required fields in bulletin');
      }
      
      // Ensure highlights is an array with at least one item
      if (!Array.isArray(bulletin.highlights) || bulletin.highlights.length === 0) {
        throw new Error('Highlights must be a non-empty array');
      }
      
    } catch (parseError) {
      console.error('Failed to parse bulletin JSON:', parseError, 'Content:', content);
      // Fallback: create a basic bulletin from the raw content
      bulletin = {
        headline: scenario.title?.toUpperCase() || 'SIMULATION COMPLETE',
        subheadline: 'A geopolitical simulation just concluded',
        stats: {
          turns: currentTurn || 1,
          tensionStart: startingTension,
          tensionEnd: tensionLevel,
          tensionDelta: tensionLevel >= startingTension ? `+${tensionLevel - startingTension}` : `${tensionLevel - startingTension}`,
          outcome: diplomaticStatus
        },
        highlights: [
          `${playerActor?.name || 'Player'} navigated ${currentTurn} turns of complex diplomacy`,
          `Tension levels shifted from ${startingTension}% to ${tensionLevel}%`,
          `Global sentiment: ${globalSentiment}`,
        ],
        verdict: 'The simulation has concluded. The world watches what happens next.'
      };
    }

    return NextResponse.json({ summary: bulletin });
  } catch (error) {
    console.error('Summary generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
