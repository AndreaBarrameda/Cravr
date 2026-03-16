// import OpenAI from 'openai';
// import { env } from '../config/env';

// export const openai = new OpenAI({
//   apiKey: env.openaiApiKey
// });

// export async function resolveCraving(text: string, locale: string | undefined) {
//   const prompt = `
// You are part of a craving-first food discovery app.

// User craving: "${text}"
// Locale: ${locale || 'en-US'}

// Return a JSON object with:
// - normalized (string)
// - tags (array of strings)
// - suggested_cuisines (array of {slug,name,score})
// - maps_keywords (array of strings)
// - likely_dishes (array of strings)
// - confidence (number 0-1)
// `;

//   const completion = await openai.responses.create({
//     model: 'gpt-4.1-mini',
//     input: prompt,
//     response_format: { type: 'json_object' }
//   });

//   const raw = (completion.output[0]?.content[0] as any)?.text ?? '{}';
//   return JSON.parse(raw);
// }

import OpenAI from 'openai';
import { env } from '../config/env';

export const openai = env.openaiApiKey ? new OpenAI({
  apiKey: env.openaiApiKey,
}) : undefined;

export async function resolveCraving(text: string, locale: string | undefined) {
  const prompt = `
You are part of a craving-first food discovery app.

User craving: "${text}"
Locale: ${locale || 'en-US'}

Return a JSON object with:
- normalized (string)
- tags (array of strings)
- suggested_cuisines (array of {slug,name,score})
- maps_keywords (array of strings)
- likely_dishes (array of strings)
- confidence (number 0-1)
`;

  const completion = await openai.responses.create({
    model: 'gpt-4.1-mini',
    input: prompt,
    text: {
      format: {
        type: 'json_schema',
        name: 'craving_resolution',
        schema: {
          type: 'object',
          properties: {
            normalized: { type: 'string' },
            tags: {
              type: 'array',
              items: { type: 'string' },
            },
            suggested_cuisines: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  slug: { type: 'string' },
                  name: { type: 'string' },
                  score: { type: 'number' },
                },
                required: ['slug', 'name', 'score'],
                additionalProperties: false,
              },
            },
            maps_keywords: {
              type: 'array',
              items: { type: 'string' },
            },
            likely_dishes: {
              type: 'array',
              items: { type: 'string' },
            },
            confidence: { type: 'number' },
          },
          required: [
            'normalized',
            'tags',
            'suggested_cuisines',
            'maps_keywords',
            'likely_dishes',
            'confidence',
          ],
          additionalProperties: false,
        },
      },
    },
  });

  return JSON.parse(completion.output_text || '{}');
}

export async function generateMatchReason(restaurantName: string, cuisine: string, rating: number, priceLevel: number): Promise<string> {
  try {
    // Generate a smart reason using simple heuristics since API may not be available
    const reasons = [];

    if (rating >= 4.5) {
      reasons.push(`Top-rated ${cuisine}`);
    } else if (rating >= 4.0) {
      reasons.push(`Highly-rated ${cuisine}`);
    } else {
      reasons.push(`Great ${cuisine}`);
    }

    if (priceLevel === 1) {
      reasons.push('affordable');
    } else if (priceLevel <= 2) {
      reasons.push('reasonably-priced');
    } else {
      reasons.push('upscale');
    }

    // Add restaurant-specific touch
    const adjectives = ['authentic', 'popular', 'highly-recommended', 'local favorite'];
    reasons.push(adjectives[Math.floor(Math.random() * adjectives.length)]);

    return `${reasons[0]}, ${reasons[1]} ${reasons[2]} spot`;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to generate AI reason:', e);
    return `Great match for your ${cuisine} craving`;
  }
}

export interface GeneratedDish {
  name: string;
  description: string;
  price: number;        // Philippine Pesos
  temperature: string;  // "hot" | "cold" | "room"
  flavor: string;       // "savory" | "sweet" | "spicy" | "umami" | "sour"
  texture: string;      // "brothy" | "soft" | "crunchy" | "creamy" | "chewy"
  intensity: string;    // "mild" | "medium" | "intense"
}

export interface RestaurantDescription {
  atmosphere: string;           // "Cozy & intimate", "Lively & trendy", etc.
  why_match: string;            // Why it fits the user's craving
  suggested_dishes: string[];   // 3-5 specific dishes to order
  vibe: string;                 // Quick vibe description
  best_for: string;             // "Groups", "Dates", "Solo dining", etc.
}

export async function generateRestaurantDescription(
  restaurantName: string,
  cuisineTypes: string[],
  priceLevel: number,
  cravingText: string,
  attributes: Record<string, string | null>,
  rating: number
): Promise<RestaurantDescription> {
  if (!openai) {
    // eslint-disable-next-line no-console
    console.error('[OpenAI] Client is not initialized. Check OPENAI_API_KEY environment variable.');
    // Return fallback description
    return {
      atmosphere: 'Welcoming and comfortable dining experience',
      why_match: `A great spot for your ${cravingText || 'food'} craving`,
      suggested_dishes: ['House Special', 'Chef\'s Recommendation', 'Customer Favorite'],
      vibe: `Casual ${cuisineTypes[0] || 'dining'} restaurant`,
      best_for: 'Everyone'
    };
  }

  try {
    const prompt = `You are a food critic and restaurant expert. Provide a detailed description of a restaurant.

Restaurant: "${restaurantName}"
Cuisine: ${cuisineTypes.join(', ')}
Rating: ${rating}/5
Price Level: ${priceLevel}/4
User's Craving: "${cravingText || 'general food exploration'}"
User Preferences: ${JSON.stringify(attributes)}

Generate a response that includes:
1. atmosphere: 1-2 sentence description of the restaurant's vibe and ambiance
2. why_match: 1-2 sentences explaining why this restaurant is perfect for the user's craving/preferences
3. vibe: 1 short sentence capturing the restaurant's essence
4. best_for: Who would enjoy this restaurant most (e.g., "Groups", "Dates", "Business meetings", "Families")
5. suggested_dishes: 3-5 specific, realistic dish names the user should definitely try at this restaurant

Make it personal, specific, and convincing. Use the restaurant name and cuisine context to suggest authentic dishes.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'restaurant_description',
          schema: {
            type: 'object',
            properties: {
              atmosphere: { type: 'string' },
              why_match: { type: 'string' },
              vibe: { type: 'string' },
              best_for: { type: 'string' },
              suggested_dishes: {
                type: 'array',
                items: { type: 'string' },
                minItems: 3,
                maxItems: 5
              }
            },
            required: ['atmosphere', 'why_match', 'vibe', 'best_for', 'suggested_dishes'],
            additionalProperties: false
          }
        }
      }
    });

    const choice = completion.choices[0];
    if (choice.message.content) {
      return JSON.parse(choice.message.content);
    }

    throw new Error('Unexpected response format from OpenAI');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to generate AI restaurant description:', e);
    // Return fallback description
    return {
      atmosphere: 'Welcoming and comfortable dining experience',
      why_match: `A great spot for your ${cravingText || 'food'} craving`,
      suggested_dishes: ['House Special', 'Chef\'s Recommendation', 'Customer Favorite'],
      vibe: `Casual ${cuisineTypes[0] || 'dining'} restaurant`,
      best_for: 'Everyone'
    };
  }
}

export async function generateRestaurantMenu(
  restaurantName: string,
  cuisineTypes: string[],
  priceLevel: number,
  cravingText: string,
  attributes: Record<string, string | null>
): Promise<GeneratedDish[]> {
  if (!openai) {
    // eslint-disable-next-line no-console
    console.error('[OpenAI] Client is not initialized. Check OPENAI_API_KEY environment variable.');
    // Return hardcoded fallback menu
    return [
      { name: 'House Specialty', description: 'Chef\'s recommended signature dish', price: 500, temperature: 'hot', flavor: 'savory', texture: 'soft', intensity: 'medium' },
      { name: 'Popular Choice', description: 'Most ordered item by our customers', price: 400, temperature: 'hot', flavor: 'savory', texture: 'soft', intensity: 'mild' },
      { name: 'Chef\'s Selection', description: 'Crafted with premium ingredients', price: 600, temperature: 'hot', flavor: 'umami', texture: 'soft', intensity: 'medium' }
    ];
  }

  try {
    // Map price level to PHP price range
    let priceRangePhp: [number, number];
    if (priceLevel === 1) {
      priceRangePhp = [150, 350];
    } else if (priceLevel === 2) {
      priceRangePhp = [300, 550];
    } else if (priceLevel === 3) {
      priceRangePhp = [500, 900];
    } else {
      priceRangePhp = [800, 2000];
    }

    const prompt = `You are a restaurant menu expert. Generate a realistic, diverse menu for a restaurant.

Restaurant: "${restaurantName}"
Cuisine Types: ${cuisineTypes.join(', ')}
Price Level: Level ${priceLevel} (PHP ₱${priceRangePhp[0]}-₱${priceRangePhp[1]} per dish)
User Craving: "${cravingText || 'any'}"
User Preferences: ${JSON.stringify(attributes)}

Generate exactly 8 restaurant-specific dishes that:
1. Match the restaurant's cuisine and name
2. Fit the price range naturally
3. Are diverse in temperature, flavor, and texture
4. Sound authentic and appetizing
5. Include realistic descriptions

Return ONLY valid JSON (no markdown, no code blocks).`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'restaurant_menu',
          schema: {
            type: 'object',
            properties: {
              dishes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    price: { type: 'number' },
                    temperature: { type: 'string', enum: ['hot', 'cold', 'room'] },
                    flavor: { type: 'string', enum: ['savory', 'sweet', 'spicy', 'umami', 'sour'] },
                    texture: { type: 'string', enum: ['brothy', 'soft', 'crunchy', 'creamy', 'chewy'] },
                    intensity: { type: 'string', enum: ['mild', 'medium', 'intense'] }
                  },
                  required: ['name', 'description', 'price', 'temperature', 'flavor', 'texture', 'intensity'],
                  additionalProperties: false
                },
                minItems: 8,
                maxItems: 8
              }
            },
            required: ['dishes'],
            additionalProperties: false
          }
        }
      }
    });

    const choice = completion.choices[0];
    if (choice.message.content) {
      const parsed = JSON.parse(choice.message.content);
      return parsed.dishes;
    }

    throw new Error('Unexpected response format from OpenAI');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to generate AI menu:', e);
    // Return hardcoded fallback menu
    return [
      { name: 'House Specialty', description: 'Chef\'s recommended signature dish', price: 500, temperature: 'hot', flavor: 'savory', texture: 'soft', intensity: 'medium' },
      { name: 'Popular Choice', description: 'Most ordered item by our customers', price: 400, temperature: 'hot', flavor: 'savory', texture: 'soft', intensity: 'mild' },
      { name: 'Chef\'s Selection', description: 'Crafted with premium ingredients', price: 600, temperature: 'hot', flavor: 'umami', texture: 'soft', intensity: 'medium' }
    ];
  }
}

export async function generateFollowupQuestions(cravingText: string, cuisine: string): Promise<{
  questions: Array<{
    question: string;
    options: Array<{
      label: string;
      attributes: {
        temperature?: string;
        flavor?: string;
        texture?: string;
        intensity?: string;
        occasion?: string;
        budget?: string;
      };
    }>;
  }>;
}> {
  if (!openai) {
    // eslint-disable-next-line no-console
    console.error('[OpenAI] Client is not initialized. Check OPENAI_API_KEY environment variable.');
    throw new Error('OpenAI client not initialized');
  }

  try {
    const prompt = `
You are part of a craving-first food discovery app. Based on the user's craving and selected cuisine, generate exactly 2 follow-up questions to refine their taste preferences.

User craving: "${cravingText}"
Selected cuisine: ${cuisine}

Generate 2 contextual questions that will help narrow down what they want. Each question should have exactly 2 button options.

For each option, provide attribute mappings (use only relevant fields: temperature, flavor, texture, intensity, occasion, budget).
Valid values:
- temperature: "hot" | "cold" | "room"
- flavor: "savory" | "sweet" | "spicy" | "umami" | "sour"
- texture: "brothy" | "soft" | "crunchy" | "creamy" | "chewy"
- intensity: "mild" | "medium" | "intense"
- occasion: "solo" | "date" | "group"
- budget: "budget" | "casual" | "upscale"

Return ONLY valid JSON (no markdown, no code blocks).`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'followup_questions',
          schema: {
            type: 'object',
            properties: {
              questions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    question: { type: 'string' },
                    options: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          label: { type: 'string' },
                          attributes: {
                            type: 'object',
                            properties: {
                              temperature: { type: 'string' },
                              flavor: { type: 'string' },
                              texture: { type: 'string' },
                              intensity: { type: 'string' },
                              occasion: { type: 'string' },
                              budget: { type: 'string' }
                            }
                          }
                        },
                        required: ['label', 'attributes'],
                        additionalProperties: false
                      },
                      minItems: 2,
                      maxItems: 2
                    }
                  },
                  required: ['question', 'options'],
                  additionalProperties: false
                },
                minItems: 2,
                maxItems: 2
              }
            },
            required: ['questions'],
            additionalProperties: false
          }
        }
      }
    });

    const choice = completion.choices[0];
    if (choice.message.content) {
      return JSON.parse(choice.message.content);
    }

    // Fallback if response format is unexpected
    throw new Error('Unexpected response format from OpenAI');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to generate AI followup questions:', e);
    // Return fallback questions
    return {
      questions: [
        {
          question: 'How hot/spicy do you like it?',
          options: [
            {
              label: 'Mild & Light',
              attributes: { temperature: 'cold', intensity: 'mild', flavor: 'savory' }
            },
            {
              label: 'Hot & Intense',
              attributes: { temperature: 'hot', intensity: 'intense', flavor: 'spicy' }
            }
          ]
        },
        {
          question: 'What texture appeals to you?',
          options: [
            {
              label: 'Soft & Creamy',
              attributes: { texture: 'soft', texture: 'creamy' }
            },
            {
              label: 'Crunchy & Fresh',
              attributes: { texture: 'crunchy', texture: 'crunchy' }
            }
          ]
        }
      ]
    };
  }
}