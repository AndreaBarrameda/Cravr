export type TasteProfileInput = {
  liked_dishes: string[];
  favorite_keywords: string[];
  favorite_cuisines: string[];
  search_history: string[];
};

type AppTasteState = {
  likedDishes?: Array<{
    name: string;
    cuisine?: string;
  }>;
  foodPreferences?: Array<{
    name: string;
  }>;
  searchHistory?: string[];
};

export function buildTasteProfileInput(state: AppTasteState): TasteProfileInput | undefined {
  const liked_dishes = (state.likedDishes || [])
    .map((dish) => dish.name?.trim())
    .filter((value): value is string => Boolean(value))
    .slice(-12);

  const favorite_keywords = (state.foodPreferences || [])
    .map((item) => item.name?.trim())
    .filter((value): value is string => Boolean(value))
    .slice(0, 8);

  const favorite_cuisines = Array.from(
    new Set(
      (state.likedDishes || [])
        .map((dish) => dish.cuisine?.trim())
        .filter((value): value is string => Boolean(value))
    )
  ).slice(0, 6);

  const search_history = (state.searchHistory || [])
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .slice(-6);

  const hasSignals =
    liked_dishes.length > 0 ||
    favorite_keywords.length > 0 ||
    favorite_cuisines.length > 0 ||
    search_history.length > 0;

  if (!hasSignals) {
    return undefined;
  }

  return {
    liked_dishes,
    favorite_keywords,
    favorite_cuisines,
    search_history
  };
}
