// Carbon Emissions & Water Usage Over Time - Line Chart with Filters
function initQ3(data) {
    const container = d3.select("#q3-chart");
    
    // Aggregate yearly data for all brands
    const yearlyTotals = d3.rollups(
        data,
        v => ({
            carbon: d3.sum(v, d => d.Carbon_Emissions_tCO2e),
            water: d3.sum(v, d => d.Water_Usage_Million_Litres)
        }),
        d => d.Year
    ).map(([Year, vals]) => ({ Year, ...vals }))
     .sort((a, b) => d3.ascending(a.Year, b.Year));

    const width = 800;
    const height = 460;
    const margin = { top: 70, right: 80, bottom: 80, left: 80 };

    const filterDiv = container.append("div")
        .style("margin-bottom", "20px")
        .style("display", "flex")
        .style("gap", "15px")
        .style("flex-wrap", "wrap")
        .style("align-items", "center")
        .style("justify-content", "center");

    const brandLabel = filterDiv.append("span")
        .style("font-weight", "bold")
        .text("Brand:");

    const brandSelect = filterDiv.append("select")
        .style("padding", "6px 10px")
        .style("font-size", "12px")
        .style("cursor", "pointer")
        .style("border-radius", "4px")
        .style("border", "1px solid #ccc");

    const brands = Array.from(new Set(data.map(d => d.Brand))).sort();
    
    brandSelect.append("option")
        .attr("value", "all")
        .text("All Brands");

    brandSelect.selectAll("option.brand")
        .data(brands)
        .enter()
        .append("option")
        .attr("class", "brand")
        .attr("value", d => d)
        .text(d => d);

    // Show label
    filterDiv.append("span")
        .style("font-weight", "bold")
        .style("margin-left", "15px")
        .text("Show:");

    let visibleLines = { carbon: true, water: true };
    let selectedBrand = "all";

    const filters = [
        { label: "Carbon Only", value: "carbon", config: { carbon: true, water: false } },
        { label: "Water Only", value: "water", config: { carbon: false, water: true } },
        { label: "Both", value: "both", config: { carbon: true, water: true } },
        { label: "Reset", value: "reset", config: { carbon: true, water: true }, isReset: true }
    ];

    const filterButtons = filterDiv.selectAll("button.filter")
        .data(filters)
        .enter()
        .append("button")
        .attr("class", "filter")
        .text(d => d.label)
        .style("padding", "6px 12px")
        .style("font-size", "12px")
        .style("cursor", "pointer")
        .style("background-color", (d, i) => i === 2 ? "#69b3a2" : "#e0e0e0")
        .style("color", (d, i) => i === 2 ? "white" : "black")
        .style("border", "none")
        .style("border-radius", "4px")
        .style("transition", "all 0.3s ease")
        .on("mouseover", function(event, d) {
            if (d3.select(this).style("background-color") !== "rgb(105, 179, 162)") {
                d3.select(this).style("background-color", "#b3d9d1");
            }
        })
        .on("mouseout", function(event, d) {
            const isActive = (d.value === "both" && visibleLines.carbon && visibleLines.water) ||
                           (d.value === "carbon" && visibleLines.carbon && !visibleLines.water) ||
                           (d.value === "water" && visibleLines.water && !visibleLines.carbon);
            d3.select(this)
                .style("background-color", isActive ? "#69b3a2" : "#e0e0e0")
                .style("color", isActive ? "white" : "black");
        })
        .on("click", function(event, d) {
            visibleLines = { ...d.config };

            filterButtons.each(function(f) {
                const isActive = (f.value === "both" && visibleLines.carbon && visibleLines.water) ||
                               (f.value === "carbon" && visibleLines.carbon && !visibleLines.water) ||
                               (f.value === "water" && visibleLines.water && !visibleLines.carbon);
                d3.select(this)
                    .style("background-color", isActive ? "#69b3a2" : "#e0e0e0")
                    .style("color", isActive ? "white" : "black");
            });

            updateChart();
        });

    brandSelect.on("change", function() {
        selectedBrand = d3.select(this).property("value");
        updateChart();
    });

    const chartDiv = container.append("div")
        .style("display", "flex")
        .style("justify-content", "center");

    function updateChart() {
        let filteredData = yearlyTotals;
        
        if (selectedBrand !== "all") {
            const brandData = data.filter(d => d.Brand === selectedBrand);
            filteredData = d3.rollups(
                brandData,
                v => ({
                    carbon: d3.sum(v, d => d.Carbon_Emissions_tCO2e),
                    water: d3.sum(v, d => d.Water_Usage_Million_Litres)
                }),
                d => d.Year
            ).map(([Year, vals]) => ({ Year, ...vals }))
             .sort((a, b) => d3.ascending(a.Year, b.Year));
        }

        const x = d3.scaleLinear()
            .domain(d3.extent(filteredData, d => d.Year))
            .range([margin.left, width - margin.right]);

        const yCarbon = d3.scaleLinear()
            .domain(d3.extent(filteredData, d => d.carbon))
            .range([height - margin.bottom, margin.top]);

        const yWater = d3.scaleLinear()
            .domain(d3.extent(filteredData, d => d.water))
            .range([height - margin.bottom, margin.top]);

        const lineCarbon = d3.line()
            .x(d => x(d.Year))
            .y(d => yCarbon(d.carbon));

        const lineWater = d3.line()
            .x(d => x(d.Year))
            .y(d => yWater(d.water));

        let svg = chartDiv.select("svg");
        if (svg.empty()) {
            svg = chartDiv.append("svg")
                .attr("width", width)
                .attr("height", height);
        }

        svg.selectAll("path.carbon-line").remove();
        svg.selectAll("path.water-line").remove();

        if (visibleLines.carbon) {
            svg.append("path")
                .attr("class", "carbon-line")
                .datum(filteredData)
                .attr("fill", "none")
                .attr("stroke", "#1f77b4")
                .attr("stroke-width", 2)
                .attr("d", lineCarbon)
                .style("opacity", 0)
                .transition()
                .duration(500)
                .style("opacity", 1);
        }

        if (visibleLines.water) {
            svg.append("path")
                .attr("class", "water-line")
                .datum(filteredData)
                .attr("fill", "none")
                .attr("stroke", "#ff7f0e")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "4 2")
                .attr("d", lineWater)
                .style("opacity", 0)
                .transition()
                .duration(500)
                .style("opacity", 1);
        }

        svg.selectAll(".chart-title").remove();
        svg.selectAll(".chart-legend").remove();
        svg.selectAll(".x-axis").remove();
        svg.selectAll(".y-axis").remove();
        svg.selectAll(".y-axis-right").remove();
        svg.selectAll(".x-label").remove();
        svg.selectAll(".y-label").remove();
        svg.selectAll(".y-label-right").remove();

        const titleText = selectedBrand === "all" 
            ? "Carbon Emissions & Water Usage Over Time (All Brands)"
            : `Carbon Emissions & Water Usage Over Time - ${selectedBrand}`;

        svg.append("text")
            .attr("class", "chart-title")
            .attr("x", width / 2)
            .attr("y", margin.top - 40)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text(titleText);

        const legend = svg.append("g")
            .attr("class", "chart-legend")
            .attr("transform", `translate(${width / 2 - 90},${margin.top - 15})`);

        if (visibleLines.carbon) {
            const carbonLegend = legend.append("g");
            carbonLegend.append("line")
                .attr("x1", 0)
                .attr("x2", 30)
                .attr("y1", 5)
                .attr("y2", 5)
                .attr("stroke", "#1f77b4")
                .attr("stroke-width", 2);

            carbonLegend.append("text")
                .attr("x", 40)
                .attr("y", 9)
                .style("font-size", "13px")
                .text("Carbon Emissions");
        }

        if (visibleLines.water) {
            const waterLegend = legend.append("g")
                .attr("transform", visibleLines.carbon ? "translate(140,0)" : "translate(0,0)");

            waterLegend.append("line")
                .attr("x1", 0)
                .attr("x2", 30)
                .attr("y1", 5)
                .attr("y2", 5)
                .attr("stroke", "#ff7f0e")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "4 2");

            waterLegend.append("text")
                .attr("x", 40)
                .attr("y", 9)
                .style("font-size", "13px")
                .text("Water Usage");
        }

        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")));

        if (visibleLines.carbon) {
            svg.append("g")
                .attr("class", "y-axis")
                .attr("transform", `translate(${margin.left},0)`)
                .call(d3.axisLeft(yCarbon));

            svg.append("text")
                .attr("class", "y-label")
                .attr("transform", "rotate(-90)")
                .attr("x", -height / 2)
                .attr("y", margin.left - 60)
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .style("font-weight", "bold")
                .style("fill", "#1f77b4")
                .text("Carbon Emissions (tCO₂e)");
        }

        if (visibleLines.water) {
            svg.append("g")
                .attr("class", "y-axis-right")
                .attr("transform", `translate(${width - margin.right},0)`)
                .call(d3.axisRight(yWater));

            svg.append("text")
                .attr("class", "y-label-right")
                .attr("transform", "rotate(90)")
                .attr("x", height / 2)
                .attr("y", -(width - margin.right + 60))
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .style("font-weight", "bold")
                .style("fill", "#ff7f0e")
                .text("Water Usage (Million Litres)");
        }

        svg.append("text")
            .attr("class", "x-label")
            .attr("x", width / 2)
            .attr("y", height - margin.bottom + 50)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text("Year");
    }

    updateChart();
}