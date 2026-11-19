export type TagColor = "blue" | "pink" | "orange" | "green" | "purple";

export interface Article {
  id: string;
  size: "big" | "side";
  title: string;
  image: string;
  alt: string;
  tag: { label: string; color: TagColor };
  times: string[];
  keywords: string[];
  paragraphs?: string[];
}

export type PinSize = "sm" | "md" | "lg";

export interface Office {
  id: string;
  city: string;
  country: string;
  role: string;
  address: string;
  phone: string;
  team: number;
  size: PinSize;
  x: number;
  y: number;
}

export interface Service {
  id: string;
  name: string;
  depositCents: number;
}
