// Core game types for the Geopolitical Simulator

// Media Types for rich event display
export type MediaType = 'tweet' | 'article' | 'pressRelease' | 'tvBroadcast' | 'leak' | 'speech' | 'statement';
export type SocialPlatform = 'twitter' | 'truth_social' | 'weibo' | 'telegram' | 'threads';
export type NewsBias = 'left' | 'center' | 'right' | 'state';

// Persona for individual actors (leaders, public figures)
export interface ActorPersona {
  socialHandle?: string;           // @realDonaldTrump, @ZelenskyyUa
  platform?: SocialPlatform;       // Primary social platform
  speechPatterns: string[];        // ["Believe me", "Many people are saying"]
  catchphrases: string[];          // ["Make America Great Again", "Slava Ukraini"]
  communicationStyle: 'bombastic' | 'diplomatic' | 'cryptic' | 'academic' | 'folksy' | 'aggressive';
  mediaPresence: 'high' | 'medium' | 'low';
  controversyTolerance: number;    // 0-100, how willing to make controversial statements
  verified?: boolean;
}

export interface Actor {
  id: string;
  name: string;
  type: 'leader' | 'organization' | 'country' | 'entity' | 'group';
  description: string;
  personality: string;
  objectives: string[];
  relationships: Record<string, 'ally' | 'enemy' | 'neutral' | 'complicated'>;
  resources: {
    military?: number;
    economic?: number;
    diplomatic?: number;
    popular?: number;
  };
  avatar?: string;
  color: string;
  isPlayer?: boolean;
  persona?: ActorPersona;          // Enhanced persona for realistic portrayal
}

export interface Milestone {
  id: string;
  date: string;
  title: string;
  description: string;
  significance: 'minor' | 'major' | 'critical';
  actorsInvolved: string[];
  worldStateChanges?: Partial<WorldState>;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  region: string;
  timeframe: {
    start: string;
    end?: string;
  };
  actors: Actor[];
  milestones: Milestone[];
  backgroundContext: string;
  currentStatus: string;
  keyIssues: string[];
}

export interface GameEvent {
  id: string;
  timestamp: Date;
  turn: number;
  type: 'action' | 'reaction' | 'autonomous' | 'news' | 'system';
  actorId: string;
  actorName: string;
  content: string;
  impact?: {
    description: string;
    affectedActors: string[];
    worldStateChanges?: Partial<WorldState>;
  };
  isPlayerAction?: boolean;
  sentiment?: 'positive' | 'negative' | 'neutral' | 'escalation' | 'deescalation';
  
  // Media-enhanced fields
  mediaType?: MediaType;
  media?: MediaContent;
}

// Rich media content for events
export interface MediaContent {
  // For tweets/social posts
  platform?: SocialPlatform;
  handle?: string;
  likes?: number;
  retweets?: number;
  replies?: number;
  verified?: boolean;
  quoteTweet?: {
    authorHandle: string;
    authorName: string;
    content: string;
  };
  
  // Public replies/comments shown under the tweet
  publicReplies?: TweetReply[];
  
  // Public quotes (people quoting this tweet with commentary)
  publicQuotes?: PublicQuote[];
  
  // For news articles
  outlet?: string;                 // "CNN", "RT", "BBC", "Fox News"
  headline?: string;
  byline?: string;
  bias?: NewsBias;
  imageDescription?: string;       // Description for placeholder image
  imageUrl?: string;               // Fetched image URL from Unsplash
  
  // For press releases
  organization?: string;           // "White House", "Kremlin", "NATO"
  classification?: 'public' | 'confidential' | 'leaked';
  officialSeal?: string;           // Emoji or icon identifier
  
  // For TV broadcasts
  channel?: string;
  program?: string;
  viewership?: string;
  liveIndicator?: boolean;
  
  // For leaks
  source?: 'anonymous' | 'insider' | 'whistleblower' | 'hacked';
  credibility?: 'unverified' | 'partially_verified' | 'confirmed';
  
  // Engagement metrics (generic)
  viralScore?: number;             // 0-100, how much attention this got
  reactions?: MediaReaction[];
}

export interface MediaReaction {
  actorId: string;
  actorName: string;
  type: 'like' | 'retweet' | 'quote' | 'condemn' | 'support' | 'dismiss';
  content?: string;
  platform?: SocialPlatform;
}

// Public persona types for regular people, memers, influencers
export type PublicPersonaType = 'citizen' | 'memer' | 'influencer' | 'celebrity' | 'journalist' | 'expert' | 'bot';

export interface PublicPersona {
  handle: string;                    // @username
  displayName: string;               // Display name
  type: PublicPersonaType;
  avatar?: string;                   // Single emoji or letter
  verified?: boolean;                // Blue check for influencers/celebrities
  followerCount?: string;            // "12.4K", "2.1M"
  bio?: string;                      // Short bio line
}

// Reply/comment on a tweet
export interface TweetReply {
  id: string;
  author: PublicPersona;
  content: string;
  likes: number;
  timestamp?: Date;
  isPopular?: boolean;               // Show as "top reply"
}

// Quote tweet from public users
export interface PublicQuote {
  id: string;
  author: PublicPersona;
  content: string;
  originalTweetId?: string;
  likes: number;
  retweets: number;
  timestamp?: Date;
}

export interface TrendingTopic {
  hashtag: string;                 // #TrumpZelenskyCall
  sentiment: 'positive' | 'negative' | 'mixed';
  volume: number;                  // Relative engagement 0-100
  associatedActors: string[];
}

export interface PublicOpinion {
  byRegion: Record<string, number>;        // {"US": 45, "EU": 60, "Russia": -30}
  trending: TrendingTopic[];
  narrativeControl: Record<string, number>; // Which actors control the narrative
  mediaCoverage: 'heavy' | 'moderate' | 'light';
}

export interface WorldState {
  tensionLevel: number; // 0-100
  globalSentiment: string;
  activeConflicts: string[];
  economicImpact: string;
  humanitarianSituation: string;
  diplomaticStatus: string;
  keyMetrics: Record<string, number>;
  publicOpinion?: PublicOpinion;   // Enhanced public opinion tracking
}

// Action types for the action selector
export type ActionType = 'diplomatic' | 'military' | 'economic' | 'social_media' | 'press_release' | 'covert' | 'personal';

// Player goal/objective for tracking progress
export interface PlayerGoal {
  type: 'suggested' | 'custom';
  objectiveId?: string;      // if selecting from actor objectives
  customText?: string;       // if custom goal
  description: string;       // resolved text for display
  progress: number;          // 0-100
  lastEvaluation?: string;   // AI reasoning for current progress
  evaluatedAt?: number;      // turn number of last evaluation
}

export interface GameState {
  scenario: Scenario | null;
  playerId: string | null;
  playerActorId: string | null;
  startingMilestoneId: string | null;
  playerGoal: PlayerGoal | null;
  currentTurn: number;
  events: GameEvent[];
  worldState: WorldState;
  phase: 'setup' | 'character-select' | 'milestone-select' | 'goal-select' | 'playing' | 'ended';
  viewMode: 'graphics' | 'chat' | 'social';  // Added social media timeline view
  isProcessing: boolean;
  selectedActionType?: ActionType;           // For action type selector
}

export interface ActionValidation {
  isValid: boolean;
  warnings: string[];
  suggestions?: string[];
}

export interface SimulationResponse {
  events: GameEvent[];
  worldStateUpdate: Partial<WorldState>;
  actorUpdates?: Partial<Actor>[];
  goalProgressUpdate?: {
    progress: number;        // 0-100
    evaluation: string;      // AI reasoning
  };
}

// API Types
export interface ScenarioDiscoveryRequest {
  query?: string;           // Text query describing the scenario
  sourceUrl?: string;       // URL to extract scenario from (tweet, news article)
  timeframe?: string;
}

export interface ScenarioDiscoveryResponse {
  scenario: Scenario;
  sources?: string[];
}

export interface SimulateActionRequest {
  gameState: GameState;
  playerAction: string;
}

export interface ValidateActionRequest {
  scenario: Scenario;
  playerActorId: string;
  action: string;
  currentWorldState: WorldState;
}
