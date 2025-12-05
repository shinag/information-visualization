function initQ7(data, world) {
  const container = d3.select("#q7-chart");

const filterContainer = container.append("div")
  .style("text-align", "center")
  .style("margin", "20px 0")
  .style("padding", "10px")
  .style("background", "#f5f5f5")
  .style("border-radius", "8px");

filterContainer.append("span")
  .style("font-weight", "bold")
  .style("margin-right", "15px")
  .text("Filter by Impact:");

const filters = [
  { label: "High Impact", value: "high" },
  { label: "Medium Impact", value: "medium" },
  { label: "Low Impact", value: "low" }
];

let activeFilter = null;

const buttons = filterContainer.selectAll("button.filter-btn")
  .data(filters)
  .join("button")
  .attr("class", "filter-btn")
  .text(d => d.label)
  .style("margin", "0 5px")
  .style("padding", "8px 15px")
  .style("cursor", "pointer")
  .style("border", "2px solid #ccc")
  .style("border-radius", "4px")
  .style("background", "white")
  .style("color", "#333")
  .style("font-weight", "500")
  .style("transition", "all 0.3s")
  .on("mouseover", function() {
    if (d3.select(this).datum().value !== activeFilter) {
      d3.select(this).style("background", "#e9ecef");
    }
  })
  .on("mouseout", function() {
    const d = d3.select(this).datum();
    if (d.value !== activeFilter) {
      d3.select(this).style("background", "white");
    }
  })
  .on("click", function(event, d) {
    activeFilter = d.value;
    buttons
      .style("background", b => b.value === activeFilter ? "#007bff" : "white")
      .style("color", b => b.value === activeFilter ? "white" : "#333")
      .style("border-color", b => b.value === activeFilter ? "#007bff" : "#ccc");
    resetButton
      .style("opacity", "1")
      .style("pointer-events", "auto");
    applyFilter(d.value);
  });

filterContainer.append("span")
  .style("margin", "0 10px")
  .style("color", "#ccc")
  .text("|");

const resetButton = filterContainer.append("button")
  .attr("class", "reset-btn")
  .text(" Reset View")
  .style("margin", "0 5px")
  .style("padding", "8px 15px")
  .style("cursor", "pointer")
  .style("border", "2px solid #dc3545")
  .style("border-radius", "4px")
  .style("background", "white")
  .style("color", "#dc3545")
  .style("font-weight", "500")
  .style("transition", "all 0.3s")
  .style("opacity", "0.5")
  .style("pointer-events", "none")
  .on("mouseover", function() {
    if (activeFilter !== null) {
      d3.select(this)
        .style("background", "#dc3545")
        .style("color", "white");
    }
  })
  .on("mouseout", function() {
    if (activeFilter !== null) {
      d3.select(this)
        .style("background", "white")
        .style("color", "#dc3545");
    }
  })
  .on("click", function() {
    activeFilter = null;
    buttons
      .style("background", "white")
      .style("color", "#333")
      .style("border-color", "#ccc");
    d3.select(this)
      .style("opacity", "0.5")
      .style("pointer-events", "none");
    resetFilter();
    svg.transition()
      .duration(750)
      .call(zoom.transform, d3.zoomIdentity);
    d3.select(this)
      .transition()
      .duration(200)
      .style("transform", "scale(0.95)")
      .transition()
      .duration(200)
      .style("transform", "scale(1)");
  });

const countryNameMap = {
  "USA": "United States of America",
  "US": "United States of America",
  "United States": "United States of America",
  "U.S.A.": "United States of America",
  "U.S.": "United States of America",
  "UK": "United Kingdom",
  "Britain": "United Kingdom",
  "Great Britain": "United Kingdom",
  "England": "United Kingdom",
  "Czech Republic": "Czechia",
  "Macedonia": "North Macedonia",
  "South Korea": "Republic of Korea",
  "North Korea": "North Korea",
  "Burma": "Myanmar",
  "Vietnam": "Viet Nam",
  "UAE": "United Arab Emirates",
  "Palestine": "Palestine",
  "Congo": "Democratic Republic of the Congo",
  "DRC": "Democratic Republic of the Congo",
  "Congo-Brazzaville": "Republic of the Congo",
  "Ivory Coast": "Côte d'Ivoire",
  "Cape Verde": "Cabo Verde",
  "Swaziland": "Eswatini",
  "East Timor": "Timor-Leste",
  "Russia": "Russia",
  "Tanzania": "United Republic of Tanzania",
  "Bolivia": "Bolivia",
  "Venezuela": "Venezuela",
  "Iran": "Iran",
  "Syria": "Syria",
  "Laos": "Lao PDR",
  "Moldova": "Republic of Moldova",
  "Brunei": "Brunei Darussalam",
  "The Bahamas": "Bahamas",
  "The Gambia": "Gambia"
};

// Add this after countryNameMap and BEFORE normalizedData
const countryAgg = d3.rollup(
    data,
    v => ({
        carbon: d3.sum(v, d => d.Carbon_Emissions_tCO2e),
        water: d3.sum(v, d => d.Water_Usage_Liters) / 1000000,
        waste: d3.sum(v, d => d.Waste_Production_kg) / 1000
    }),
    d => d.Country
);

const normalizedData = Array.from(countryAgg, ([country, values]) => {
    const normalizedCountry = countryNameMap[country] || country;
    const impactIndex = (values.carbon / 10000) + (values.water / 1000) + (values.waste / 100);
    return {
        Country: normalizedCountry,
        carbon: values.carbon,
        water: values.water,
        waste: values.waste,
        impactIndex: impactIndex
    };
});
console.log("Normalized countries:", normalizedData.map(d => d.Country).sort());

const width = 1050;
const height = 600;
const marginTop = 80;
const marginRight = 150;
const mapWidth = width - marginRight;
const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("display", "block")
    .style("margin", "0 auto")
    .style("background", "#f0f8ff");

const projection = d3.geoNaturalEarth1()
    .scale(160)
    .translate([mapWidth / 2, (height - marginTop) / 2 + marginTop]);
const path = d3.geoPath().projection(projection);
const impactMap = new Map(normalizedData.map(d => [d.Country, d]));
const color = d3.scaleSequential()
    .domain(d3.extent(normalizedData, d => d.impactIndex))
    .interpolator(d3.interpolateReds);

const topoCountries = new Set(
  topojson.feature(world, world.objects.countries).features
    .map(d => d.properties.name)
);
const missingCountries = normalizedData.filter(d => !topoCountries.has(d.Country));
if (missingCountries.length > 0) {
  console.log("Countries in data but not matching TopoJSON:", 
    missingCountries.map(d => d.Country)
  );
}

const tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("padding", "8px 10px")
    .style("background", "white")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("visibility", "hidden")
    .style("font-size", "12px")
    .style("box-shadow", "0 2px 4px rgba(0,0,0,0.2)")
    .style("z-index", "1000");

svg.append("text")
    .attr("x", width / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "22px")
    .style("font-weight", "bold")
    .text("Environmental Impact Index by Country");

svg.append("text")
    .attr("x", width / 2)
    .attr("y", 55)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", "#666")
    .text("Hover for details • Click country to zoom • Click background to reset");

const g = svg.append("g");

const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", (event) => {
      g.attr("transform", event.transform);
    });

svg.call(zoom);

g.append("path")
  .datum({type: "Sphere"})
  .attr("d", path)
  .attr("fill", "none")
  .attr("stroke", "#333")
  .attr("stroke-width", 1.5);

const graticule = d3.geoGraticule();
g.append("path")
  .datum(graticule)
  .attr("d", path)
  .attr("fill", "none")
  .attr("stroke", "#ccc")
  .attr("stroke-width", 0.5)
  .attr("stroke-opacity", 0.5);

const countries = g.append("g")
  .selectAll("path")
  .data(topojson.feature(world, world.objects.countries).features)
  .join("path")
    .attr("d", path)
    .attr("fill", d => {
      const entry = impactMap.get(d.properties.name);
      return entry ? color(entry.impactIndex) : "#eee";
    })
    .attr("stroke", "#666")
    .attr("stroke-width", 0.5)
    .style("cursor", "pointer")
    .on("mouseover", function(event, d) {
      const entry = impactMap.get(d.properties.name);
      if (!entry) return;
      const opacity = d3.select(this).style("opacity");
      if (parseFloat(opacity) < 0.5) return;
      d3.select(this)
        .attr("stroke", "#333")
        .attr("stroke-width", 2)
        .raise();
      tooltip.style("visibility", "visible")
             .html(`
               <strong>${d.properties.name}</strong><br/>
               CO₂: ${entry.carbon.toLocaleString()} tCO₂e<br/>
               Water: ${entry.water.toLocaleString()} ML<br/>
               Waste: ${entry.waste.toLocaleString()} tonnes<br/>
               Impact Index: ${entry.impactIndex.toFixed(3)}
             `);
    })
    .on("mousemove", (event) => {
      tooltip.style("top", event.pageY + 15 + "px")
             .style("left", event.pageX + 15 + "px");
    })
    .on("mouseout", function() {
      d3.select(this)
        .attr("stroke", "#666")
        .attr("stroke-width", 0.5);
      tooltip.style("visibility", "hidden");
    })
    .on("click", function(event, d) {
      event.stopPropagation();
      const opacity = d3.select(this).style("opacity");
      if (parseFloat(opacity) < 0.5) return;
      const [[x0, y0], [x1, y1]] = path.bounds(d);
      const dx = x1 - x0;
      const dy = y1 - y0;
      const x = (x0 + x1) / 2;
      const y = (y0 + y1) / 2;
      const scale = Math.min(8, 0.9 / Math.max(dx / width, dy / height));
      const translate = [width / 2 - scale * x, height / 2 - scale * y];
      svg.transition()
        .duration(750)
        .call(
          zoom.transform,
          d3.zoomIdentity
            .translate(translate[0], translate[1])
            .scale(scale)
        );
    });

function applyFilter(filterValue) {
  const threshold = d3.extent(normalizedData, d => d.impactIndex);
  const range = threshold[1] - threshold[0];
  
  countries
    .transition()
    .duration(500)
    .style("opacity", (d) => {
      const entry = impactMap.get(d.properties.name);
      if (!entry) return 0.2;
      if (filterValue === "high") 
        return entry.impactIndex > threshold[0] + range * 0.66 ? 1 : 0.2;
      if (filterValue === "medium") 
        return entry.impactIndex >= threshold[0] + range * 0.33 && 
               entry.impactIndex <= threshold[0] + range * 0.66 ? 1 : 0.2;
      if (filterValue === "low") 
        return entry.impactIndex < threshold[0] + range * 0.33 ? 1 : 0.2;
      return 1;
    });
}

function resetFilter() {
  countries
    .transition()
    .duration(500)
    .style("opacity", (d) => {
      const entry = impactMap.get(d.properties.name);
      return entry ? 1 : 1;
    });
}

svg.on("click", () => {
  svg.transition()
    .duration(750)
    .call(zoom.transform, d3.zoomIdentity);
});

const legendHeight = 250;
const legendWidth = 20;
const legendX = mapWidth + 30;
const legendY = (height - legendHeight) / 2 + 20;

const defs = svg.append("defs");
const linearGradient = defs.append("linearGradient")
    .attr("id", "legend-gradient")
    .attr("x1", "0%").attr("y1", "100%")
    .attr("x2", "0%").attr("y2", "0%");

linearGradient.selectAll("stop")
    .data(d3.ticks(0, 1, 10))
    .join("stop")
    .attr("offset", d => `${d * 100}%`)
    .attr("stop-color", d => color(d3.min(normalizedData, d => d.impactIndex) + d * (d3.max(normalizedData, d => d.impactIndex) - d3.min(normalizedData, d => d.impactIndex))));

svg.append("rect")
    .attr("x", legendX)
    .attr("y", legendY)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient)")
    .style("stroke", "#999")
    .style("stroke-width", 1);

const legendScale = d3.scaleLinear()
    .domain(d3.extent(normalizedData, d => d.impactIndex))
    .range([legendY + legendHeight, legendY]);

const legendAxis = d3.axisRight(legendScale)
    .ticks(6)
    .tickFormat(d3.format(".2f"));

svg.append("g")
    .attr("transform", `translate(${legendX + legendWidth},0)`)
    .call(legendAxis)
    .style("font-size", "11px")
    .select(".domain").remove();

svg.append("text")
    .attr("x", legendX + legendWidth / 2)
    .attr("y", legendY - 15)
    .attr("text-anchor", "middle")
    .style("font-size", "13px")
    .style("font-weight", "bold")
    .text("Impact Index");
}