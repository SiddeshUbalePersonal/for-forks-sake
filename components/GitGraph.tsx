"use client";

import { useGitStore } from "@/store/useGitStore";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useRef } from "react";
import { TransformWrapper, TransformComponent, ReactZoomPanPinchContentRef } from "react-zoom-pan-pinch";
import { Maximize, ZoomIn, ZoomOut } from "lucide-react";

export function GitGraph() {
    const { commits, head, branches, currentBranch } = useGitStore();
    const transformComponentRef = useRef<ReactZoomPanPinchContentRef>(null);

    // Calculate Layout (X, Y)
    const { nodes, maxX, maxY, branchLanes } = useMemo(() => {
        const lanes: Record<string, number> = { main: 0 };
        let nextLane = 1;

        // Helper to get lane for a branch
        const getLane = (branchName: string) => {
            if (lanes[branchName] !== undefined) return lanes[branchName];
            lanes[branchName] = nextLane++;
            return lanes[branchName];
        };

        const calculatedNodes = commits.map((commit, index) => {
            const lane = getLane(commit.branch);
            return {
                ...commit,
                x: index,
                y: lane
            };
        });

        return {
            nodes: calculatedNodes,
            maxX: commits.length,
            maxY: nextLane,
            branchLanes: lanes
        };
    }, [commits]);

    // Layout Constants
    const X_SPACING = 100;
    const Y_SPACING = 80;
    const NODE_RADIUS = 24;

    const getBranchesForCommit = (commitId: string) => {
        return Object.entries(branches)
            .filter(([_, id]) => id === commitId)
            .map(([name]) => name);
    };

    return (
        <div className="w-full h-full relative bg-dot-pattern"> {/* Optional pattern for canvas feel */}
            <TransformWrapper
                ref={transformComponentRef}
                initialScale={1}
                minScale={0.5}
                maxScale={2}
                limitToBounds={false}
                wheel={{ step: 0.1 }}
            >
                {({ zoomIn, zoomOut, resetTransform, centerView }) => (
                    <>
                        <div className="absolute top-4 left-4 z-30 flex flex-col gap-2 bg-background/80 backdrop-blur rounded-lg border border-border p-1 shadow-sm">
                            <button onClick={() => centerView(0.5)} className="p-2 hover:bg-muted rounded text-muted-foreground hover:text-foreground" title="Fit to Screen">
                                <Maximize size={16} />
                            </button>
                            <div className="h-px bg-border w-full" />
                            <button onClick={() => zoomIn()} className="p-2 hover:bg-muted rounded text-muted-foreground hover:text-foreground" title="Zoom In">
                                <ZoomIn size={16} />
                            </button>
                            <button onClick={() => zoomOut()} className="p-2 hover:bg-muted rounded text-muted-foreground hover:text-foreground" title="Zoom Out">
                                <ZoomOut size={16} />
                            </button>
                        </div>

                        <TransformComponent
                            wrapperClass="w-full h-full"
                            contentClass="w-full h-full min-h-[500px] min-w-[800px]" // minimal bounds for drag
                        >
                            <div
                                className="relative"
                                style={{
                                    width: Math.max((maxX * X_SPACING) + 200, 800),
                                    height: Math.max((maxY * Y_SPACING) + 400, 700),
                                    paddingTop: 100,
                                    paddingBottom: 200
                                }}
                            >
                                {/* SVG Layer for Edges */}
                                <svg
                                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                                >
                                    {nodes.map((node) => {
                                        return node.parentIds.map((parentId) => {
                                            const parent = nodes.find(n => n.id === parentId);
                                            if (!parent) return null;

                                            const startX = parent.x * X_SPACING + 100; // Offset for padding
                                            const startY = parent.y * Y_SPACING + 100;
                                            const endX = node.x * X_SPACING + 100;
                                            const endY = node.y * Y_SPACING + 100;

                                            const controlX1 = startX + X_SPACING / 2;
                                            const controlY1 = startY;
                                            const controlX2 = endX - X_SPACING / 2;
                                            const controlY2 = endY;

                                            const pathData = `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;

                                            return (
                                                <motion.path
                                                    key={`edge-${node.id}-${parentId}`}
                                                    d={pathData}
                                                    fill="none"
                                                    stroke="rgb(var(--foreground))"
                                                    strokeOpacity="0.2"
                                                    strokeWidth="2"
                                                    initial={{ pathLength: 0, opacity: 0 }}
                                                    animate={{ pathLength: 1, opacity: 1 }}
                                                    transition={{ duration: 0.5 }}
                                                />
                                            );
                                        });
                                    })}
                                </svg>

                                {/* Nodes Layer */}
                                <AnimatePresence>
                                    {nodes.map((node) => {
                                        const isHead = head === node.id;
                                        const branchLabels = getBranchesForCommit(node.id);
                                        const laneIndex = branchLanes[node.branch] || 0;
                                        const colors = ["border-blue-500", "border-green-500", "border-orange-500", "border-purple-500", "border-pink-500"];
                                        const branchColor = colors[laneIndex % colors.length];

                                        return (
                                            <motion.div
                                                key={node.id}
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{
                                                    scale: 1,
                                                    opacity: 1,
                                                    x: node.x * X_SPACING + 100 - NODE_RADIUS,
                                                    y: node.y * Y_SPACING + 100 - NODE_RADIUS
                                                }}
                                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                                className="absolute flex items-center justify-center group"
                                            >
                                                {/* Labels (Refs) */}
                                                <div className="absolute -top-10 flex flex-col-reverse gap-1 items-center z-20 pointer-events-none transform -translate-y-2">
                                                    {isHead && (
                                                        <motion.div
                                                            layoutId="head-badge"
                                                            className="bg-primary/20 text-primary border border-primary/50 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1 backdrop-blur-sm whitespace-nowrap"
                                                        >
                                                            HEAD
                                                        </motion.div>
                                                    )}
                                                    {branchLabels.map(branch => {
                                                        const isActive = branch === currentBranch;
                                                        return (
                                                            <div key={branch} className={`
                                                                text-[10px] px-2 py-0.5 rounded-md font-mono flex items-center gap-1 backdrop-blur-sm shadow-sm whitespace-nowrap transition-colors
                                                                ${isActive
                                                                    ? 'bg-primary text-primary-foreground font-bold ring-2 ring-primary/50 z-10'
                                                                    : 'bg-muted/90 text-foreground border border-border'
                                                                }
                                                                ${branch === node.branch && !isActive ? 'ring-1 ring-primary/30' : ''}
                                                            `}>
                                                                {branch}
                                                                {isActive && isHead && <span className="ml-1 opacity-70 text-[8px]">(HEAD)</span>}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Commit Circle */}
                                                <div
                                                    className={`
                                            w-12 h-12 rounded-full border-2 bg-background z-10 flex items-center justify-center shadow-lg transition-all duration-300
                                            ${isHead ? 'ring-4 ring-primary/20 scale-110' : ''}
                                            ${branchColor}
                                        `}
                                                >
                                                    <span className="text-[10px] font-mono opacity-70">{node.id.substring(0, 3)}</span>
                                                </div>

                                                {/* Message Tooltip */}
                                                <div className="absolute top-14 left-1/2 -translate-x-1/2 w-48 text-center text-xs text-muted-foreground bg-muted/90 backdrop-blur px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity border border-border/50 z-30 pointer-events-none">
                                                    {node.message}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </TransformComponent>
                    </>
                )}
            </TransformWrapper>
        </div>
    );
}
