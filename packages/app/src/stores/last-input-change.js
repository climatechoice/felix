// Store for tracking the last changed input and its previous value
// { id: string, prevValue: any }
import { atom } from 'nanostores';

export const lastInputChange = atom({ id: null, prevValue: null });
