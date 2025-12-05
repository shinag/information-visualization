// Brand Sustainability Performance Over Time - Multi-line Chart
function initQ8(data) {
    const container = d3.select("#q8-chart");

    // Calculate composite metric
    const compositeMetric = d => d.Carbon_Emissions_tCO2e +
                                d.Water_Usage_Million_Litres +
                                d.Landfill_Waste_Tonnes;

    const brands = Array.from(new Set(data.map(d => d.Brand))).sort();
    const nestedData = d3.group(data, d => d.Brand);
    const years = Array.from(new Set(data.map(d => d.Year))).sort((a, b) => a - b);

    const processed = brands.map(brand => ({
        brand,
        values: years.map(year => {
            const yearData = nestedData.get(brand).filter(d => d.Year === year);
            return { 
                year, 
                value: d3.sum(yearData, compositeMetric),
                details: {
                    carbon: d3.sum(yearData, d => d.Carbon_Emissions_tCO2e),
                    water: d3.sum(yearData, d => d.Water_Usage_Million_Litres),
                    waste: d3.sum(yearData, d => d.Landfill_Waste_Tonnes)
                }
            };
        })
    }));

    const margin = { top: 80, right: 150, bottom: 80, left: 80 };
    const width = 1000 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    container.append("h3")
        .text("Sustainability Performance Over Time")
        .style("text-align", "center")
        .style("margin-bottom", "10px")
        .style("font-size", "24px")
        .style("color", "#333");

    container.append("p")
        .text("Interactive comparison of environmental impact across brands")
        .style("text-align", "center")
        .style("color", "#666")
        .style("margin-bottom", "20px")
        .style("font-size", "14px");

    // Controls
    const controls = container.append("div")
        .style("text-align", "center")
        .style("margin-bottom", "20px")
        .style("padding", "15px")
        .style("background", "#f8f9fa")
        .style("border-radius", "8px");

    controls.append("span")
        .text("Select Brands: ")
        .style("font-weight", "bold")
        .style("margin-right", "10px");

    let selectedBrands = new Set(brands);

    const toggleAll = controls.append("button")
        .text("Deselect All")
        .style("margin-right", "10px")
        .style("padding", "5px 12px")
        .style("border", "1px solid #ccc")
        .style("border-radius", "4px")
        .style("background", "#fff")
        .style("cursor", "pointer")
        .on("click", function() {
            if (selectedBrands.size === brands.length) {
                selectedBrands.clear();
                d3.select(this).text("Select All");
            } else {
                selectedBrands = new Set(brands);
                d3.select(this).text("Deselect All");
            }
            updateChart();
            updateButtons();
        });

    const brandButtons = controls.append("div")
        .style("margin-top", "10px");

    const colorScale = d3.scaleOrdinal()
        .domain(brands)
        .range(d3.schemeTableau10);

    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("background", "#fff")
        .style("border", "1px solid #ddd")
        .style("border-radius", "8px")
        .style("box-shadow", "0 2px 8px rgba(0,0,0,0.1)")
        .style("display", "block")
        .style("margin", "0 auto");

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
        .domain(d3.extent(years))
        .range([0, width]);

    const maxY = d3.max(processed.flatMap(d => d.values.map(v => v.value)));
    const y = d3.scaleLinear()
        .domain([0, maxY])
        .range([height, 0])
        .nice();

    g.append("g")
        .attr("class", "grid")
        .attr("opacity", 0.1)
        .call(d3.axisLeft(y)
            .ticks(10)
            .tickSize(-width)
            .tickFormat("")
        );

    const xAxis = g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x)
            .ticks(years.length)
            .tickFormat(d3.format("d")))
        .style("font-size", "12px");

    xAxis.selectAll("line")
        .attr("stroke", "#999");

    const yAxis = g.append("g")
        .call(d3.axisLeft(y).ticks(8))
        .style("font-size", "12px");

    yAxis.selectAll("line")
        .attr("stroke", "#999");

    svg.append("text")
        .attr("transform", `translate(${margin.left + width / 2}, ${height + margin.top + 50})`)
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text("Year");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 20)
        .attr("x", -(margin.top + height / 2))
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text("Composite Environmental Impact");

    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.value))
        .curve(d3.curveMonotoneX);

    const area = d3.area()
        .x(d => x(d.year))
        .y0(height)
        .y1(d => y(d.value))
        .curve(d3.curveMonotoneX);

    const tooltip = d3.select("body")
        .selectAll(".tooltip-q8")
        .data([null])
        .join("div")
        .attr("class", "tooltip tooltip-q8")
        .style("position", "absolute")
        .style("background", "white")
        .style("border", "1px solid #ccc")
        .style("border-radius", "4px")
        .style("padding", "10px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("box-shadow", "0 2px 8px rgba(0,0,0,0.15)")
        .style("font-size", "12px")
        .style("z-index", "1000");

    const linesGroup = g.append("g").attr("class", "lines");
    const areasGroup = g.append("g").attr("class", "areas");
    const pointsGroup = g.append("g").attr("class", "points");

    const legend = svg.append("g")
        .attr("transform", `translate(${width + margin.left + 20}, ${margin.top})`);

    legend.append("text")
        .attr("y", -10)
        .style("font-weight", "bold")
        .style("font-size", "13px")
        .text("Brands");

    const buttonData = brands.map(brand => ({
        brand,
        color: colorScale(brand),
        selected: true
    }));

    const brandButtonElements = brandButtons.selectAll("button")
        .data(buttonData)
        .join("button")
        .text(d => d.brand)
        .style("margin", "3px")
        .style("padding", "6px 12px")
        .style("border", d => `2px solid ${d.color}`)
        .style("border-radius", "4px")
        .style("background", d => d.color)
        .style("color", "white")
        .style("cursor", "pointer")
        .style("font-weight", "500")
        .style("transition", "all 0.3s")
        .on("mouseover", function() {
            d3.select(this)
                .style("transform", "translateY(-2px)")
                .style("box-shadow", "0 4px 8px rgba(0,0,0,0.2)");
        })
        .on("mouseout", function() {
            d3.select(this)
                .style("transform", "translateY(0)")
                .style("box-shadow", "none");
        })
        .on("click", function(event, d) {
            if (selectedBrands.has(d.brand)) {
                selectedBrands.delete(d.brand);
            } else {
                selectedBrands.add(d.brand);
            }
            updateChart();
            updateButtons();
        });

    function updateButtons() {
        brandButtonElements
            .style("background", d => selectedBrands.has(d.brand) ? d.color : "white")
            .style("color", d => selectedBrands.has(d.brand) ? "white" : d.color)
            .style("opacity", d => selectedBrands.has(d.brand) ? 1 : 0.5);
        
        toggleAll.text(selectedBrands.size === brands.length ? "Deselect All" : "Select All");
    }

    function updateChart() {
        const filteredData = processed.filter(d => selectedBrands.has(d.brand));

        areasGroup.selectAll(".area")
            .data(filteredData, d => d.brand)
            .join(
                enter => enter.append("path")
                    .attr("class", "area")
                    .attr("fill", d => colorScale(d.brand))
                    .attr("opacity", 0)
                    .attr("d", d => area(d.values)),
                update => update
                    .transition()
                    .duration(500)
                    .attr("d", d => area(d.values)),
                exit => exit
                    .transition()
                    .duration(300)
                    .attr("opacity", 0)
                    .remove()
            );

        linesGroup.selectAll(".line")
            .data(filteredData, d => d.brand)
            .join(
                enter => enter.append("path")
                    .attr("class", "line")
                    .attr("fill", "none")
                    .attr("stroke", d => colorScale(d.brand))
                    .attr("stroke-width", 3)
                    .attr("d", d => line(d.values))
                    .attr("stroke-dasharray", function() {
                        const length = this.getTotalLength();
                        return `${length} ${length}`;
                    })
                    .attr("stroke-dashoffset", function() {
                        return this.getTotalLength();
                    })
                    .transition()
                    .duration(1000)
                    .attr("stroke-dashoffset", 0),
                update => update
                    .transition()
                    .duration(500)
                    .attr("d", d => line(d.values)),
                exit => exit
                    .transition()
                    .duration(300)
                    .attr("opacity", 0)
                    .remove()
            )
            .on("mouseover", function(event, d) {
                d3.selectAll(".line")
                    .transition()
                    .duration(200)
                    .attr("opacity", 0.2)
                    .attr("stroke-width", 3);
                
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("opacity", 1)
                    .attr("stroke-width", 5);

                areasGroup.selectAll(".area")
                    .filter(area => area.brand === d.brand)
                    .transition()
                    .duration(200)
                    .attr("opacity", 0.1);
            })
            .on("mouseout", function() {
                d3.selectAll(".line")
                    .transition()
                    .duration(200)
                    .attr("opacity", 1)
                    .attr("stroke-width", 3);

                areasGroup.selectAll(".area")
                    .transition()
                    .duration(200)
                    .attr("opacity", 0);
            });

        const points = pointsGroup.selectAll(".point-group")
            .data(filteredData, d => d.brand)
            .join("g")
            .attr("class", "point-group");

        points.selectAll("circle")
            .data(d => d.values.map(v => ({ ...v, brand: d.brand })))
            .join(
                enter => enter.append("circle")
                    .attr("cx", d => x(d.year))
                    .attr("cy", d => y(d.value))
                    .attr("r", 0)
                    .attr("fill", d => colorScale(d.brand))
                    .attr("stroke", "white")
                    .attr("stroke-width", 2)
                    .style("cursor", "pointer")
                    .transition()
                    .delay((d, i) => i * 100)
                    .duration(300)
                    .attr("r", 5),
                update => update
                    .transition()
                    .duration(500)
                    .attr("cx", d => x(d.year))
                    .attr("cy", d => y(d.value)),
                exit => exit
                    .transition()
                    .duration(300)
                    .attr("r", 0)
                    .remove()
            );

        points.selectAll("circle")
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 8);

                tooltip
                    .style("opacity", 1)
                    .html(`
                        <strong>${d.brand}</strong><br/>
                        <strong>Year:</strong> ${d.year}<br/>
                        <strong>Total Impact:</strong> ${d.value.toFixed(2)}<br/>
                        <hr style="margin: 5px 0; border: none; border-top: 1px solid #ddd;">
                        <strong>Carbon:</strong> ${d.details.carbon.toFixed(2)} tCO₂e<br/>
                        <strong>Water:</strong> ${d.details.water.toFixed(2)} ML<br/>
                        <strong>Waste:</strong> ${d.details.waste.toFixed(2)} tonnes
                    `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 5);

                tooltip.style("opacity", 0);
            });

        const legendItems = legend.selectAll(".legend-item")
            .data(filteredData, d => d.brand)
            .join(
                enter => {
                    const item = enter.append("g")
                        .attr("class", "legend-item")
                        .attr("transform", (d, i) => `translate(0, ${i * 25})`)
                        .style("cursor", "pointer")
                        .style("opacity", 0);

                    item.append("rect")
                        .attr("width", 18)
                        .attr("height", 18)
                        .attr("fill", d => colorScale(d.brand))
                        .attr("rx", 3);

                    item.append("text")
                        .attr("x", 24)
                        .attr("y", 9)
                        .attr("dy", "0.35em")
                        .style("font-size", "12px")
                        .text(d => d.brand);

                    return item.transition()
                        .duration(500)
                        .style("opacity", 1);
                },
                update => update
                    .transition()
                    .duration(500)
                    .attr("transform", (d, i) => `translate(0, ${i * 25})`),
                exit => exit
                    .transition()
                    .duration(300)
                    .style("opacity", 0)
                    .remove()
            )
            .on("mouseover", function(event, d) {
                linesGroup.selectAll(".line")
                    .filter(line => line.brand === d.brand)
                    .transition()
                    .duration(200)
                    .attr("stroke-width", 5);

                d3.select(this)
                    .select("rect")
                    .transition()
                    .duration(200)
                    .attr("width", 22)
                    .attr("height", 22);
            })
            .on("mouseout", function() {
                linesGroup.selectAll(".line")
                    .transition()
                    .duration(200)
                    .attr("stroke-width", 3);

                d3.select(this)
                    .select("rect")
                    .transition()
                    .duration(200)
                    .attr("width", 18)
                    .attr("height", 18);
            })
            .on("click", function(event, d) {
                if (selectedBrands.has(d.brand)) {
                    selectedBrands.delete(d.brand);
                } else {
                    selectedBrands.add(d.brand);
                }
                updateChart();
                updateButtons();
            });
    }

    updateChart();
}