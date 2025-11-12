import { useEffect, useRef, useState, useCallback } from "react"
import * as d3 from "d3"
import { Maximize2, Minimize2 } from "lucide-react"
import { Switch } from "../components/ui/switch"
import { Label } from "../components/ui/label"
import { trackEvent } from "@/utils/analytics"

function NetworkGraphCanvas({ data }) {
  const canvasRef = useRef()
  const containerRef = useRef()
  const simulationRef = useRef(null)
  const transformRef = useRef(d3.zoomIdentity)
  const imageCacheRef = useRef(new Map())
  const animationFrameRef = useRef(null)
  const isDraggingRef = useRef(false)
  
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hideLeafNodes, setHideLeafNodes] = useState(false)
  const [hoveredNode, setHoveredNode] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [tooltip, setTooltip] = useState(null)
  const selectedNodeRef = useRef(null)
  const hoveredNodeRef = useRef(null)

  // Calculate dimensions based on container
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        setDimensions({
          width: Math.max(400, containerWidth - 20),
          height: isFullscreen ? window.innerHeight - 100 : 600,
        })
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [isFullscreen])

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    trackEvent(
      "click",
      "network_graph",
      "fullscreen_toggle",
      isFullscreen ? 0 : 1
    )
  }

  // Filter nodes and edges based on hideLeafNodes
  const getFilteredData = useCallback(() => {
    if (!data || !data.graph_data) {
      return { nodes: [], edges: [] }
    }

    if (!hideLeafNodes) {
      return { nodes: data.graph_data.nodes, edges: data.graph_data.edges }
    }

    // Filter nodes: keep seed creators OR nodes with more than 1 connection
    const filteredNodes = data.graph_data.nodes.filter((node) => {
      if (node.is_seed) return true

      const connectionsCount = data.graph_data.edges.reduce((count, edge) => {
        return (
          count +
          (edge.source.id === node.id ? 1 : 0) +
          (edge.target.id === node.id ? 1 : 0)
        )
      }, 0)

      return connectionsCount > 1
    })

    const filteredNodeIds = filteredNodes.map((node) => node.id)

    const filteredEdges = data.graph_data.edges.filter((edge) => {
      return (
        filteredNodeIds.includes(edge.source.id) &&
        filteredNodeIds.includes(edge.target.id)
      )
    })

    return {
      nodes: filteredNodes,
      edges: filteredEdges,
    }
  }, [data, hideLeafNodes])

  // Helper function to format numbers
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M"
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K"
    }
    return num.toString()
  }

  // Preload images
  useEffect(() => {
    if (!data || !data.graph_data) return

    const { nodes } = getFilteredData()
    const cache = imageCacheRef.current

    nodes.forEach((node) => {
      if (node.picture_url && !cache.has(node.picture_url)) {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          cache.set(node.picture_url, img)
        }
        img.onerror = () => {
          cache.set(node.picture_url, null) // Mark as failed
        }
        img.src = node.picture_url
      }
    })
  }, [data, getFilteredData])

  // Initialize and run simulation
  useEffect(() => {
    if (!data || !data.graph_data) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    const dpr = window.devicePixelRatio || 1

    // Set canvas size accounting for device pixel ratio
    const { width, height } = dimensions
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    const { nodes, edges } = getFilteredData()

    if (nodes.length === 0) return

    // Calculate center for forces
    const centerX = width / 2
    const centerY = height / 2

    // Calculate follower-based radius scale
    const followerCounts = nodes.map((d) => d.followers || 0)
    const minFollowers = Math.min(...followerCounts)
    const maxFollowers = Math.max(...followerCounts)

    const radiusScale = d3
      .scaleSqrt()
      .domain([minFollowers, maxFollowers])
      .range([4, 20])

    // Initialize node positions if not set
    nodes.forEach((node) => {
      if (node.x === undefined || node.y === undefined) {
        node.x = centerX + (Math.random() - 0.5) * width * 0.5
        node.y = centerY + (Math.random() - 0.5) * height * 0.5
      }
    })

    // Create the force simulation with optimizations
    // Use reuseHeumann if available for better performance with many nodes
    let chargeForce = d3.forceManyBody().strength(-250)
    if (d3.forceManyBodyReuseHeumann) {
      chargeForce = d3.forceManyBodyReuseHeumann().strength(-250)
    }
    
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(edges)
          .id((d) => d.id)
          .distance(80)
          .strength(0.3)
      )
      .force("charge", chargeForce)
      .force("center", d3.forceCenter(centerX, centerY))
      .force("collision", d3.forceCollide().radius(15))
      .force("x", d3.forceX(centerX).strength(0.05))
      .force("y", d3.forceY(centerY).strength(0.05))
      .alpha(0.5)
      .alphaDecay(0.02) // Slightly faster decay for quicker stabilization
      .velocityDecay(0.4) // Add velocity decay for smoother motion

    simulationRef.current = simulation

    // Render function - only render when simulation is active or when needed
    const needsRenderRef = { current: true }
    let lastRenderTime = 0
    const targetFPS = 60
    const frameInterval = 1000 / targetFPS

    const render = (currentTime) => {
      // Throttle rendering to target FPS
      if (currentTime - lastRenderTime < frameInterval) {
        animationFrameRef.current = requestAnimationFrame(render)
        return
      }
      lastRenderTime = currentTime

      // Only render if simulation is active, we're dragging, or we need to update
      const isSimulationActive = simulation.alpha() > 0.01
      const isDragging = isDraggingRef.current
      if (!isSimulationActive && !isDragging && !needsRenderRef.current) {
        animationFrameRef.current = requestAnimationFrame(render)
        return
      }
      // Don't reset needsRender if we're dragging - keep rendering
      if (!isDragging) {
        needsRenderRef.current = false
      }

      ctx.clearRect(0, 0, width, height)
      ctx.save()
      
      // Apply zoom transform
      const transform = transformRef.current
      ctx.translate(transform.x, transform.y)
      ctx.scale(transform.k, transform.k)

      // Get visible bounds for culling
      const k = transform.k
      const tx = transform.x
      const ty = transform.y
      const visibleBounds = {
        left: (-tx) / k,
        right: (width - tx) / k,
        top: (-ty) / k,
        bottom: (height - ty) / k,
      }

      // Get connected node IDs for highlighting
      const currentSelectedNode = selectedNodeRef.current
      const connectedNodeIds = currentSelectedNode
        ? new Set(
            edges
              .filter(
                (edge) =>
                  (edge.source.id === currentSelectedNode.id ||
                    edge.source === currentSelectedNode.id) ||
                  (edge.target.id === currentSelectedNode.id ||
                    edge.target === currentSelectedNode.id)
              )
              .flatMap((edge) => [
                edge.source.id || edge.source,
                edge.target.id || edge.target,
              ])
          )
        : new Set()

      // Draw edges
      edges.forEach((edge) => {
        const source = edge.source
        const target = edge.target

        // Skip if both nodes are outside visible bounds
        if (
          (source.x < visibleBounds.left - 50 ||
            source.x > visibleBounds.right + 50 ||
            source.y < visibleBounds.top - 50 ||
            source.y > visibleBounds.bottom + 50) &&
          (target.x < visibleBounds.left - 50 ||
            target.x > visibleBounds.right + 50 ||
            target.y < visibleBounds.top - 50 ||
            target.y > visibleBounds.bottom + 50)
        ) {
          return
        }

        const isConnected =
          currentSelectedNode &&
          (source.id === currentSelectedNode.id ||
            target.id === currentSelectedNode.id ||
            connectedNodeIds.has(source.id) ||
            connectedNodeIds.has(target.id))

        ctx.beginPath()
        ctx.moveTo(source.x, source.y)
        ctx.lineTo(target.x, target.y)
        ctx.strokeStyle = "#999"
        ctx.lineWidth = Math.sqrt(edge.weight || 1) * 2
        ctx.globalAlpha = isConnected ? 0.8 : currentSelectedNode ? 0.1 : 0.6
        ctx.stroke()
      })

      // Draw nodes
      nodes.forEach((node) => {
        // Skip if outside visible bounds
        if (
          node.x < visibleBounds.left - 30 ||
          node.x > visibleBounds.right + 30 ||
          node.y < visibleBounds.top - 30 ||
          node.y > visibleBounds.bottom + 30
        ) {
          return
        }

        const radius = node.is_seed ? 16 : radiusScale(node.followers || 0)
        const isConnected =
          !currentSelectedNode ||
          node.id === currentSelectedNode.id ||
          connectedNodeIds.has(node.id)

        ctx.globalAlpha = isConnected ? 1 : 0.2

        // Draw circle background
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI)
        ctx.fillStyle = node.is_seed ? "#3b82f6" : "#94a3b8"
        ctx.fill()
        ctx.strokeStyle = node.is_seed ? "#1d4ed8" : "#64748b"
        ctx.lineWidth = node.is_seed ? 4 : 2
        ctx.stroke()

        // Draw profile image if available and zoomed in enough
        const zoomLevel = transform.k
        if (zoomLevel > 0.5 && node.picture_url) {
          const cachedImg = imageCacheRef.current.get(node.picture_url)
          if (cachedImg) {
            ctx.save()
            ctx.beginPath()
            ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI)
            ctx.clip()
            ctx.drawImage(
              cachedImg,
              node.x - radius,
              node.y - radius,
              radius * 2,
              radius * 2
            )
            ctx.restore()
          }
        }

        // Draw label for seed nodes if zoomed in enough
        if (node.is_seed && zoomLevel > 0.7) {
          ctx.fillStyle = "#1f2937"
          ctx.font = "bold 12px sans-serif"
          ctx.fillText(node.name, node.x + radius + 4, node.y + 4)
        }
      })

      ctx.restore()

      // Request next frame
      animationFrameRef.current = requestAnimationFrame(render)
    }

    // Start rendering loop
    animationFrameRef.current = requestAnimationFrame(render)

    // Update on simulation tick - pause simulation when alpha is low
    simulation.on("tick", () => {
      // Mark that we need to render
      needsRenderRef.current = true
      // Pause simulation when it's settled to save CPU
      if (simulation.alpha() < 0.01) {
        simulation.stop()
      }
    })
    
    // Resume simulation on interaction
    const resumeSimulation = () => {
      needsRenderRef.current = true
      if (simulation.alpha() < 0.01) {
        simulation.alpha(0.3).restart()
      }
    }

    // Setup drag for nodes (declare before zoom so we can reference isDraggingRef)
    let draggedNode = null

    // Helper to check if click is on a node
    const isClickOnNode = (event) => {
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      const transform = transformRef.current
      const k = transform.k
      const tx = transform.x
      const ty = transform.y
      const graphX = (x - tx) / k
      const graphY = (y - ty) / k

      for (const node of nodes) {
        const dist = Math.sqrt(
          Math.pow(node.x - graphX, 2) + Math.pow(node.y - graphY, 2)
        )
        const radius = node.is_seed ? 16 : radiusScale(node.followers || 0)
        if (dist < radius) {
          return true
        }
      }
      return false
    }

    // Setup zoom - prevent when clicking on nodes
    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 4])
      .filter((event) => {
        // Allow zoom with wheel, prevent pan when clicking on nodes
        if (event.type === "wheel") return true
        if (event.type === "mousedown" && event.button === 0) {
          return !isClickOnNode(event)
        }
        return true
      })
      .on("zoom", (event) => {
        if (!isDraggingRef.current) {
          transformRef.current = event.transform
          needsRenderRef.current = true
        }
      })

    d3.select(canvas).call(zoom)

    const handleMouseDown = (event) => {
      // Only handle left mouse button
      if (event.button !== 0) return

      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      // Transform coordinates (accounting for zoom)
      const transform = transformRef.current
      const k = transform.k
      const tx = transform.x
      const ty = transform.y
      const graphX = (x - tx) / k
      const graphY = (y - ty) / k

      // Find node under cursor
      let foundNode = null
      let minDist = Infinity

      nodes.forEach((node) => {
        const dist = Math.sqrt(
          Math.pow(node.x - graphX, 2) + Math.pow(node.y - graphY, 2)
        )
        const radius = node.is_seed ? 16 : radiusScale(node.followers || 0)
        if (dist < radius && dist < minDist) {
          minDist = dist
          foundNode = node
        }
      })

      if (foundNode) {
        draggedNode = foundNode
        isDraggingRef.current = true
        // Keep simulation active during drag
        if (simulation.alpha() < 0.01) {
          simulation.alpha(0.3).restart()
        }
        simulation.alphaTarget(0.3) // Keep simulation active while dragging
        foundNode.fx = foundNode.x
        foundNode.fy = foundNode.y
        
        // Show tooltip for dragged node
        setTooltip({
          x: x,
          y: y,
          content: `${foundNode.name}\n${foundNode.headline || ""}\n${
            foundNode.followers
              ? formatNumber(foundNode.followers) + " followers"
              : ""
          }`,
        })
        
        needsRenderRef.current = true
        event.preventDefault()
        event.stopPropagation()
        canvas.style.cursor = "grabbing"
      }
    }

    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      if (!isDraggingRef.current || !draggedNode) {
        // Check for hover
        const transform = transformRef.current
        const k = transform.k
        const tx = transform.x
        const ty = transform.y
        const graphX = (x - tx) / k
        const graphY = (y - ty) / k

        let foundNode = null
        let minDist = Infinity

        nodes.forEach((node) => {
          const dist = Math.sqrt(
            Math.pow(node.x - graphX, 2) + Math.pow(node.y - graphY, 2)
          )
          const radius = node.is_seed ? 16 : radiusScale(node.followers || 0)
          if (dist < radius && dist < minDist) {
            minDist = dist
            foundNode = node
          }
        })

        if (foundNode !== hoveredNodeRef.current) {
          hoveredNodeRef.current = foundNode
          setHoveredNode(foundNode)
          if (foundNode) {
            setTooltip({
              x: x,
              y: y,
              content: `${foundNode.name}\n${foundNode.headline || ""}\n${
                foundNode.followers
                  ? formatNumber(foundNode.followers) + " followers"
                  : ""
              }`,
            })
          } else {
            setTooltip(null)
          }
          needsRenderRef.current = true
        }
        return
      }

      // Handle dragging
      const transform = transformRef.current
      const k = transform.k
      const tx = transform.x
      const ty = transform.y
      const graphX = (x - tx) / k
      const graphY = (y - ty) / k

      draggedNode.fx = graphX
      draggedNode.fy = graphY
      // Keep simulation active during drag
      if (simulation.alpha() < 0.01) {
        simulation.alpha(0.3).restart()
      }
      simulation.alphaTarget(0.3) // Maintain active simulation
      
      // Update tooltip position during drag
      if (draggedNode) {
        setTooltip({
          x: x,
          y: y,
          content: `${draggedNode.name}\n${draggedNode.headline || ""}\n${
            draggedNode.followers
              ? formatNumber(draggedNode.followers) + " followers"
              : ""
          }`,
        })
      }
      
      needsRenderRef.current = true
      event.preventDefault()
    }

    const handleMouseUp = (event) => {
      if (isDraggingRef.current && draggedNode) {
        isDraggingRef.current = false
        simulation.alphaTarget(0)
        draggedNode.fx = null
        draggedNode.fy = null
        draggedNode = null
        canvas.style.cursor = "grab"
        // Keep tooltip showing after drag ends (user can move mouse to see it)
      }
    }

    const handleClick = (event) => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false
        return
      }

      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      const transform = transformRef.current
      const k = transform.k
      const tx = transform.x
      const ty = transform.y
      const graphX = (x - tx) / k
      const graphY = (y - ty) / k

      let foundNode = null
      let minDist = Infinity

      nodes.forEach((node) => {
        const dist = Math.sqrt(
          Math.pow(node.x - graphX, 2) + Math.pow(node.y - graphY, 2)
        )
        const radius = node.is_seed ? 16 : radiusScale(node.followers || 0)
        if (dist < radius && dist < minDist) {
          minDist = dist
          foundNode = node
        }
      })

      if (foundNode) {
        if (selectedNodeRef.current && selectedNodeRef.current.id === foundNode.id) {
          selectedNodeRef.current = null
          setSelectedNode(null)
        } else {
          selectedNodeRef.current = foundNode
          setSelectedNode(foundNode)
        }
        needsRenderRef.current = true
        event.stopPropagation()
      } else {
        selectedNodeRef.current = null
        setSelectedNode(null)
        needsRenderRef.current = true
      }
    }

    canvas.addEventListener("mousedown", handleMouseDown)
    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("mouseup", handleMouseUp)
    canvas.addEventListener("click", handleClick)
    canvas.style.cursor = "grab"

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      simulation.stop()
      canvas.removeEventListener("mousedown", handleMouseDown)
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("mouseup", handleMouseUp)
      canvas.removeEventListener("click", handleClick)
    }
  }, [data, dimensions, getFilteredData])

  if (!data || !data.graph_data) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No graph data available</p>
      </div>
    )
  }

  const filteredData = getFilteredData()

  return (
    <div
      className={`w-full ${
        isFullscreen ? "fixed inset-0 z-50 bg-white p-4" : ""
      }`}
      ref={containerRef}
    >
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold">Network Visualization</h3>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            {filteredData.nodes.length} nodes, {filteredData.edges.length}{" "}
            connections
          </div>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Hide Leaf Nodes Toggle */}
      <div className="mb-4 flex items-center space-x-2">
        <Switch
          id="hide-leaf-nodes"
          checked={hideLeafNodes}
          onCheckedChange={(checked) => {
            setHideLeafNodes(checked)
            trackEvent(
              "click",
              "network_graph",
              "hide_leaf_nodes_toggle",
              checked ? 1 : 0
            )
          }}
        />
        <Label htmlFor="hide-leaf-nodes" className="text-sm cursor-pointer">
          Hide Leaf Nodes
        </Label>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white relative">
        <canvas
          ref={canvasRef}
          className="w-full"
          style={{ 
            height: `${dimensions.height}px`, 
            display: "block",
            cursor: "grab"
          }}
        />
        {tooltip && (
          <div
            className="absolute bg-gray-900 text-white text-xs rounded px-2 py-1 pointer-events-none z-10 shadow-lg"
            style={{
              left: `${tooltip.x + 10}px`,
              top: `${tooltip.y + 10}px`,
              whiteSpace: "pre-line",
              maxWidth: "200px",
            }}
          >
            {tooltip.content}
          </div>
        )}
      </div>
      <div className="mt-2 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-blue-500"></span>
          Seed creators
        </span>
        <span className="inline-flex items-center gap-1 ml-4">
          <span className="w-3 h-3 rounded-full bg-gray-400"></span>
          Network members
        </span>
        <span className="ml-4">Drag nodes to explore • Zoom to navigate</span>
      </div>
    </div>
  )
}

export default NetworkGraphCanvas

