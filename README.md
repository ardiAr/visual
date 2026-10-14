# Visual — live linked-list C++ preview

Open `index.html` through any static HTTP server. For example: `python3 -m http.server 8000`, then visit http://localhost:8000. No build is needed. Internet access is required to load the pinned Lezer C++ parser from esm.sh.

The original visualisasi_linked_list_c.html is preserved and linked in the footer. The new index is an editable, code-driven version: data, links, pointer names, node counts, traversal, and stdout are derived from the parsed program rather than hardcoded steps. Edits immediately show the final trace; reset/play/previous/next/timeline replay it.

Supported educational subset: int main, Node* initialized declarations, int initialized variables, new Node(), pointer assignments, ->data and ->next, NULL/nullptr, while, cout with strings/data/endl, delete, integer + - * and comparisons == != < >. Unsupported statements and syntax errors report their line; no source is executed as JavaScript. This is not a full C++ compiler. Addresses are simulated. Loops are capped at 500 trace steps and allocations at 40 nodes. new Node() starts zero-initialized. The tool also accepts new Node as a simplified educational allocation.

Manual regression checks:
1. Original sample prints 10 -> 20 -> 30 -> NULL.
2. Change head->data to 77: first node and stdout change to 77 immediately.
3. Change head->next to third: stdout skips 20.
4. Declare a fourth Node: four heap boxes appear.
5. Break an assignment: diagnostics appear, playback is disabled.
6. Link third->next to head: bounded execution reports a loop error.
7. Reset then next: heap starts empty, then allocates one node.
8. Import/export preserves the code; verify narrow viewport has no page overflow.
