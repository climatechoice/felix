// Store for tracking layout preferences per graph category
import { atom } from 'nanostores';

// Maps category name to graph count { "Food": 4, "Historical Data": 9, ... }
export const categoryLayouts = atom({});
