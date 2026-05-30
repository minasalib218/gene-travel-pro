import {
  mockActivities,
  mockCars,
  mockFlights,
  mockHotels,
  mockRestaurants,
  mockTransports,
} from "@/lib/recommendation/mockData";
import { rankRecommendationsWithAI } from "@/lib/recommendation/aiPlanner";
import type {
  ActivityRecommendation,
  CarRecommendation,
  FlightRecommendation,
  HotelRecommendation,
  RestaurantRecommendation,
  TransportRecommendation,
  UserTripInput,
} from "@/lib/recommendation/types";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getHotelRecommendations(inputs: UserTripInput): Promise<HotelRecommendation[]> {
  await sleep(250);
  return rankRecommendationsWithAI("hotel", inputs, mockHotels).slice(0, 3);
}

export async function getFlightRecommendations(inputs: UserTripInput): Promise<FlightRecommendation[]> {
  await sleep(250);
  return rankRecommendationsWithAI("flight", inputs, mockFlights).slice(0, 3);
}

export async function getActivityRecommendations(inputs: UserTripInput): Promise<ActivityRecommendation[]> {
  await sleep(250);
  return rankRecommendationsWithAI("activity", inputs, mockActivities).slice(0, 4);
}

export async function getRestaurantRecommendations(
  inputs: UserTripInput,
): Promise<RestaurantRecommendation[]> {
  await sleep(250);
  return rankRecommendationsWithAI("restaurant", inputs, mockRestaurants).slice(0, 3);
}

export async function getTransportRecommendations(inputs: UserTripInput): Promise<TransportRecommendation[]> {
  await sleep(250);
  return rankRecommendationsWithAI("transport", inputs, mockTransports).slice(0, 3);
}

export async function getCarRecommendations(inputs: UserTripInput): Promise<CarRecommendation[]> {
  await sleep(250);
  return rankRecommendationsWithAI("car", inputs, mockCars).slice(0, 3);
}
