// Production Volume vs Waste Generation - Scatter Plot
function initQ2(data) {
    const container = d3.select("#q2-chart");

    // Aggregate by brand
    const brandTotals = d3.rollups(
        data,
        v => ({
            carbon: d3.sum(v, d => d.Carbon_Emissions_tCO2e),
            water: d3.sum(v, d => d.Water_Usage_Million_Litres),
            production: d3.sum(v, d => d.Monthly_Production_Tonnes) / 1000, // Convert to Million Units
            waste: d3.sum(v, d => d.Landfill_Waste_Tonnes)
        }),
        d => d.Brand
    ).map(([Brand, vals]) => ({
        Brand,
        ...vals
    }));

    const width = 800;
    const height = 420;
    const margin = { top: 30, right: 120, bottom: 60, left: 80 };

    const x = d3.scaleLinear()
        .domain(d3.extent(brandTotals, d => d.production))
        .nice()
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain(d3.extent(brandTotals, d => d.waste))
        .nice()
        .range([height - margin.bottom, margin.top]);

    const color = d3.scaleOrdinal()
        .domain(brandTotals.map(d => d.Brand))
        .range(d3.schemeTableau10);

    const tooltip = d3.select("body")
        .selectAll(".tooltip-q2")
        .data([null])
        .join("div")
        .attr("class", "tooltip tooltip-q2")
        .style("position", "absolute")
        .style("padding", "6px 10px")
        .style("background", "rgba(0, 0, 0, 0.95)")
        .style("color", "white")
        .style("border-radius", "4px")
        .style("font-size", "11px")
        .style("pointer-events", "none")
        .style("display", "none")
        .style("z-index", "1000")
        .style("line-height", "1.4");

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("display", "block")
        .style("margin", "0 auto");

    svg.selectAll("circle")
        .data(brandTotals)
        .join("circle")
        .attr("cx", d => x(d.production))
        .attr("cy", d => y(d.waste))
        .attr("r", 6)
        .attr("fill", d => color(d.Brand))
        .attr("opacity", 0.8)
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
            const wastePerUnit = (d.waste / d.production).toFixed(3);
            tooltip.style("display", "block")
                .html(`
                    <strong>${d.Brand}</strong><br/>
                    <strong>Production: ${d.production.toFixed(2)} M Units</strong><br/>
                    <strong>Waste: ${d.waste.toFixed(2)} Tons</strong><br/>
                    <strong>Waste/Unit: ${wastePerUnit} Tons/MUnit</strong><br/>
                    <strong>Carbon: ${d.carbon.toFixed(2)} tCO₂e</strong><br/>
                    <strong>Water: ${d.water.toFixed(2)} M Liters</strong>
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 30) + "px");

            d3.select(this)
                .transition()
                .duration(200)
                .attr("r", 10)
                .attr("opacity", 1)
                .style("stroke", "#FFD700")
                .style("stroke-width", 2);
        })
        .on("mousemove", (event) => {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 30) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("display", "none");
            d3.select(this)
                .transition()
                .duration(200)
                .attr("r", 6)
                .attr("opacity", 0.8)
                .style("stroke", "none");
        });

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .style("font-size", "11px");

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .style("font-size", "11px");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - margin.bottom + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text("Production Volume (Million Units)");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", margin.left - 60)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text("Waste Generation (Tons)");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.top - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Production Volume vs Waste Generation by Brand");

    const legend = svg.append("g")
        .attr("transform", `translate(${width - 110},${margin.top})`);

    brandTotals.forEach((d, i) => {
        const g = legend.append("g")
            .attr("transform", `translate(0,${i * 18})`);

        g.append("rect")
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", color(d.Brand));

        g.append("text")
            .attr("x", 15)
            .attr("y", 9)
            .text(d.Brand)
            .style("font-size", "11px");
    });
}