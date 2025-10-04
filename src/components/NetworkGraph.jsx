import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Maximize2, Minimize2 } from "lucide-react"

function NetworkGraph({ data }) {
  const svgRef = useRef()
  const containerRef = useRef()
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Calculate dimensions based on container
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        setDimensions({
          width: Math.max(400, containerWidth - 20), // Min width 400px, account for padding
          height: isFullscreen ? window.innerHeight - 100 : 600, // Fullscreen or fixed height
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
  }

  useEffect(() => {
    if (!data || !data.graph_data) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove() // Clear previous render

    const { nodes, edges } = data.graph_data
    const { width, height } = dimensions

    // Calculate center for forces
    const centerX = width / 2
    const centerY = height / 2

    // Create the force simulation
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
      .force("charge", d3.forceManyBody().strength(-150))
      .force("center", d3.forceCenter(centerX, centerY))
      .force("collision", d3.forceCollide().radius(15))
      .force("x", d3.forceX(centerX).strength(0.05))
      .force("y", d3.forceY(centerY).strength(0.05))
      .alpha(0.3)
      .alphaDecay(0.02)

    // Create SVG
    const g = svg.attr("width", width).attr("height", height).append("g")

    // Add zoom behavior
    const zoom = d3.zoom().on("zoom", (event) => {
      g.attr("transform", event.transform)
    })
    svg.call(zoom)

    // Create links
    const link = g
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d) => Math.sqrt(d.weight) * 2)

    // Create nodes
    const node = g
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("class", "node")

    // Calculate follower-based radius scale
    const followerCounts = nodes.map((d) => d.followers || 0)
    const minFollowers = Math.min(...followerCounts)
    const maxFollowers = Math.max(...followerCounts)

    const radiusScale = d3
      .scaleSqrt()
      .domain([minFollowers, maxFollowers])
      .range([4, 20]) // Min 4px, max 20px radius

    // Add circles as background/fallback
    node
      .append("circle")
      .attr("r", (d) => {
        if (d.is_seed) return 16 // Seed creators are always larger
        return radiusScale(d.followers || 0)
      })
      .attr("fill", (d) => (d.is_seed ? "#3b82f6" : "#94a3b8"))
      .attr("stroke", (d) => (d.is_seed ? "#1d4ed8" : "#64748b"))
      .attr("stroke-width", 2)

    // Add profile pictures
    node
      .append("image")
      .attr("href", (d) => d.picture_url || "")
      .attr("x", (d) => {
        const radius = d.is_seed ? 16 : radiusScale(d.followers || 0)
        return -radius
      })
      .attr("y", (d) => {
        const radius = d.is_seed ? 16 : radiusScale(d.followers || 0)
        return -radius
      })
      .attr("width", (d) => {
        const radius = d.is_seed ? 16 : radiusScale(d.followers || 0)
        return radius * 2
      })
      .attr("height", (d) => {
        const radius = d.is_seed ? 16 : radiusScale(d.followers || 0)
        return radius * 2
      })
      .attr("clip-path", (d) => {
        const radius = d.is_seed ? 16 : radiusScale(d.followers || 0)
        return `circle(${radius}px at ${radius}px ${radius}px)`
      })
      .on("error", function () {
        // If image fails to load, hide it and show fallback
        d3.select(this).style("display", "none")
      })

    // Add labels for seed nodes
    node
      .filter((d) => d.is_seed)
      .append("text")
      .attr("dx", 15)
      .attr("dy", 4)
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "#1f2937")
      .text((d) => d.name)

    // Add tooltips
    node
      .append("title")
      .text(
        (d) =>
          `${d.name}\n${d.headline}\n${
            d.followers ? formatNumber(d.followers) + " followers" : ""
          }`
      )

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y)

      node.attr("transform", (d) => `translate(${d.x},${d.y})`)
    })

    // Add drag behavior
    const drag = d3
      .drag()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
      })
      .on("drag", (event, d) => {
        d.fx = event.x
        d.fy = event.y
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0)
        d.fx = null
        d.fy = null
      })

    node.call(drag)

    // Cleanup function
    return () => {
      simulation.stop()
    }
  }, [data, dimensions])

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

  if (!data || !data.graph_data) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No graph data available</p>
      </div>
    )
  }

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
            {data.graph_data.nodes.length} nodes, {data.graph_data.edges.length}{" "}
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
      <div className="border rounded-lg overflow-hidden bg-white">
        <svg
          ref={svgRef}
          className="w-full"
          style={{ height: `${dimensions.height}px` }}
        />
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

export default NetworkGraph
