import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { promises as fs } from 'fs';
import path from 'path';
import type { ActionValidation, ValidateActionRequest } from '@/lib/types';

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
    const body: ValidateActionRequest = await request.json();
    const { scenario, playerActorId, action, currentWorldState } = body;

    if (!scenario || !playerActorId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const playerActor = scenario.actors.find(a => a.id === playerActorId);
    if (!playerActor) {
      return NextResponse.json({ error: 'Player actor not found' }, { status: 400 });
    }

    // Get validation prompt template
    let systemPrompt = await getPromptTemplate('action-validation');

    // Replace template variables
    systemPrompt = systemPrompt
      .replace('{{SCENARIO_TITLE}}', scenario.title)
      .replace('{{PLAYER_ACTOR_NAME}}', playerActor.name)
      .replace('{{PLAYER_ACTOR_TYPE}}', playerActor.type)
      .replace('{{MILITARY_SCORE}}', String(playerActor.resources.military || 50))
      .replace('{{ECONOMIC_SCORE}}', String(playerActor.resources.economic || 50))
      .replace('{{DIPLOMATIC_SCORE}}', String(playerActor.resources.diplomatic || 50))
      .replace('{{POPULAR_SCORE}}', String(playerActor.resources.popular || 50))
      .replace('{{WORLD_STATE}}', JSON.stringify(currentWorldState, null, 2))
      .replace('{{PLAYER_ACTION}}', action);

    const userMessage = `Validate this action: "${action}"`;
    const fullPrompt = `${systemPrompt}\n\n${userMessage}`;
    
    const result = await model.generateContent(fullPrompt);
    const content = result.response.text();
    if (!content) {
      throw new Error('No content in response');
    }

    const validation: ActionValidation = JSON.parse(content);

    return NextResponse.json(validation);
  } catch (error) {
    console.error('Validation error:', error);
    // Return permissive validation on error
    return NextResponse.json({
      isValid: true,
      warnings: [],
      suggestions: [],
    });
  }
}
