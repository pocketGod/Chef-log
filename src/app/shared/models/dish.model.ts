export interface Dish {
  id?: string;
  name: string;
  description?: string;
  popularity?: number;   // configurable at runtime
  isPublic?: boolean;
  createdAt: number;     // Date.now()
}