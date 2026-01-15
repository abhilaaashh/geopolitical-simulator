# 🌍 Geopolitical Simulator

An immersive, LLM-powered turn-based geopolitical simulation game. Choose any real-world scenario, select your role, and shape history through strategic decisions.

## Features

- **Dynamic Scenario Discovery**: Describe any current affairs situation and the AI will analyze it, identifying key actors, milestones, and relationships
- **Role Selection**: Play as any key figure - world leaders, organizations, countries, or influential groups
- **Timeline Flexibility**: Start your simulation from any major milestone in the scenario
- **Turn-Based Gameplay**: Take actions as your chosen character and watch the world respond
- **Dual View Modes**: 
  - **Cards Mode**: Visual event cards with detailed information
  - **Chat Mode**: Group chat-style updates for a more conversational experience
- **Smart Action Validation**: Warnings for implausible actions (without blocking creative gameplay)
- **World State Tracking**: Monitor tension levels, diplomatic status, and global sentiment

## Getting Started

### Prerequisites

- Node.js 18+ 
- OpenAI API key

### Installation

```bash
cd project31
npm install
```

### Configuration

Create a `.env.local` file:

```env
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional - defaults to gpt-4o
OPENAI_MODEL=gpt-4o

# Optional - for enhanced scenario discovery with web search
TAVILY_API_KEY=your_tavily_api_key_here
```

### Running

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## How to Play

### 1. Choose Your Scenario
Enter any current affairs scenario (e.g., "Russia-Ukraine conflict", "US-China trade tensions", "Brexit negotiations"). The AI will analyze the situation and create a detailed game world.

### 2. Select Your Character
Browse all identified actors and choose who you want to play as. Each character has:
- Unique personality traits
- Specific objectives
- Resource levels (military, economic, diplomatic, popular support)
- Relationships with other actors

### 3. Pick Your Starting Point
Select when to begin - from the start of the conflict or any major milestone. This determines the initial state of the world.

### 4. Play!
- Type your actions in natural language
- Watch other actors respond based on their personalities
- Autonomous world events will also occur
- Track the world state as tensions rise and fall
- Switch between card view and chat view

## Architecture

```
project31/
├── app/
│   ├── api/
│   │   ├── scenario/discover/    # Scenario analysis endpoint
│   │   ├── action/validate/      # Action validation endpoint
│   │   └── simulate/             # Turn simulation endpoint
│   ├── page.tsx                  # Main game page
│   └── layout.tsx
├── components/
│   ├── setup/                    # Setup flow components
│   │   ├── ScenarioSetup.tsx
│   │   ├── CharacterSelect.tsx
│   │   └── MilestoneSelect.tsx
│   └── game/                     # Game UI components
│       ├── GameInterface.tsx
│       ├── ActionInput.tsx
│       ├── EventFeed.tsx
│       ├── ChatView.tsx
│       └── ...
├── lib/
│   ├── types.ts                  # TypeScript definitions
│   ├── store.ts                  # Zustand state management
│   └── utils.ts
└── resources/
    └── prompts/                  # LLM prompt templates
        ├── scenario-discovery.txt
        ├── actor-personality.txt
        ├── action-validation.txt
        ├── simulate-turn.txt
        └── ...
```

## Prompt Customization

All LLM prompts are stored in `/resources/prompts/`. You can customize:

- **scenario-discovery.txt**: How scenarios are analyzed
- **actor-personality.txt**: How actor personalities are generated
- **action-validation.txt**: What makes an action valid/risky
- **simulate-turn.txt**: How the world responds to player actions
- **generate-news.txt**: How news updates are formatted

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Animations**: Framer Motion
- **AI**: OpenAI GPT-4o
- **Search** (optional): Tavily API

## Tips for Best Experience

1. **Be specific in your actions**: Instead of "attack", say "Order the 3rd Infantry Division to secure the eastern checkpoint"
2. **Consider consequences**: The simulation tracks world reactions realistically
3. **Read the warnings**: Action validation gives useful context without blocking you
4. **Explore different perspectives**: Replay scenarios as different actors
5. **Watch for autonomous events**: Not everything happens in response to you

## License

MIT
