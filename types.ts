
export interface AvatarConfig {
  faceShape?: string;
  eyeColor?: string;
  eyeShape?: string;
  freckles?: boolean;
  facialHair?: string;
  ageGroup?: string;
  gender: 'male' | 'female';
  skinColor: string;
  hairColor: string;
  hairStyle: string;
  hairTexture: string;
  eyeStyle: string;
  mouthStyle: string;
  clothingColor: string;
  clothingStyle: string;
  accessory: string;
  headwear?: string;
  backgroundColor: string;
}

export interface Child {
  name: string;
  age: string;
  avatarUrl?: string; 
  avatarConfig?: AvatarConfig;
  description?: string;
}

export type TimeSlot = 'full_day' | 'morning' | 'afternoon' | 'none';

export interface AdultData {
  id: string;
  role: string; 
  avatarUrl?: string;
  avatarConfig?: AvatarConfig;
  description?: string;
}

export interface FamilyPreferences {
  adults: number;
  adultsData?: AdultData[];
  children: Child[];
  radiusKm: number;
  interests: string;
  latitude: number | null;
  longitude: number | null;
  manualLocation: string;
  specificDestination: string;
  saturdayMode: TimeSlot;
  sundayMode: TimeSlot;
  overnightStay: boolean;
  selectedDate: string;
  vibe: string;
  language: string;
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
  maps?: {
    uri?: string;
    title?: string;
    placeId?: string;
    placeAnswerSources?: {
        reviewSnippets?: {
            review?: string;
        }[]
    }
  };
}

export interface PlanResult {
  text: string;
  groundingChunks: GroundingChunk[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface VisitedLocation {
  lat: number;
  lng: number;
  title: string;
}

export interface MissionScore {
  mission: string;
  childName: string;
  score: number; 
}

export interface DiaryEntry {
  id: string;
  image: string; // Base64
  caption?: string;
  timestamp: number;
}

export type AmenityType = 'changing_table' | 'stroller' | 'fenced' | 'bottle_warmer' | 'silent';

export interface LocationRating {
  locationName: string;
  votes: Record<AmenityType, number>;
  userVotes: AmenityType[];
}

export interface SavedPlan extends PlanResult {
  id: string;
  dateCreated: number;
  title: string;
  isFavorite: boolean;
  isCompleted: boolean;
  completedSections?: string[];
  hiddenSections?: string[];
  rating?: number;
  completedMissions?: string[];
  missionScores?: MissionScore[];
  savedChildren?: Child[];
  packedItems?: string[];
  chatHistory?: ChatMessage[];
  latitude?: number | null;
  longitude?: number | null;
  visitedLocations?: VisitedLocation[];
  weekendDiary?: DiaryEntry[];
  familyRatings?: LocationRating[];
  language?: string;
  adultsData?: AdultData[];
  videoUri?: string; // Nuova proprietà per il video
}
