import { atom } from "nanostores";

// default layout contains 4 graphs
export const selectedGraphCount = atom(4);

// Layout configuration (this remains constant (unchanged)!)
/*
 * These are the Graph Layout definitions.
 * New entries can easily be added here for whichever number of graphs
 * to show. Simply:
 * 1) define the number of graphs (N), the amount of rows, and the amount of columns
 * 2) add a new #graphs-container.graphs-N .graph-container
 *    class in index.css where you define the vh and vw of each graph-container
 */
export const layoutConfig = {
  1: { rows: 1, cols: 1 },
  2: { rows: 1, cols: 2 },
  4: { rows: 2, cols: 2 },
  6: { rows: 2, cols: 3 },
  9: { rows: 3, cols: 3 },
};
