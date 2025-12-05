// Best Sustainability per Production Unit - Parallel Coordinates
function initQ4(data) {
    const container = d3.select("#q4-chart");

    const width = 900;
    const height = 480;
    const margin = { top: 50, right: 40, bottom: 40, left: 40 };

    // Aggregate metrics by brand
    const brandMetrics = d3.rollups(
        data,
        v => {
            const totalProd = d3.sum(v, d => d.Monthly_Production_Tonnes);
            const totalCarbon = d3.sum(v, d => d.Carbon_Emissions_tCO2e);
            const totalWater = d3.sum(v, d => d.Water_Usage_Million_Litres);

            const carbonPerTonne = totalProd > 0 ? totalCarbon / totalProd : NaN;
            const waterPerTonne = totalProd > 0 ? totalWater / totalProd : NaN;

            return {
                Brand: v[0].Brand,
                carbonPerTonne,
                waterPerTonne,
                Env_Cost_Index: d3.mean(v, d => d.Env_Cost_Index || 0),
                Sustainability_Score: d3.mean(v, d => d.Sustainability_Score || 0),
                Transparency_Index: d3.mean(v, d => d.Transparency_Index || 0),
                Ethical_Rating: d3.mean(v, d => d.Ethical_Rating)
            };
        },
        d => d.Brand
    ).map(([, vals]) => vals)
     .filter(d => isFinite(d.carbonPerTonne) && isFinite(d.waterPerTonne));

    const brands = brandMetrics.map(d => d.Brand);

    const dimensions = [
        { key: "carbonPerTonne", label: "Carbon / tonne (tCO₂e)", better: "low" },
        { key: "waterPerTonne", label: "Water / tonne (M L)", better: "low" },
        { key: "Env_Cost_Index", label: "Env cost index", better: "low" },
        { key: "Sustainability_Score", label: "Sustainability score", better: "high" },
        { key: "Transparency_Index", label: "Transparency", better: "high" },
        { key: "Ethical_Rating", label: "Ethical rating", better: "high" }
    ];

    // Controls
    const controls = container.append("div")
        .style("display", "flex")
        .style("align-items", "center")
        .style("justify-content", "flex-start")
        .style("gap", "1.5rem")
        .style("margin-bottom", "1rem")
        .style("flex-wrap", "wrap");

    controls.append("span")
        .style("font-weight", "bold")
        .text("Highlight brand: ");

    const brandSelect = controls.append("select")
        .style("padding", "6px 10px")
        .style("font-size", "12px")
        .style("cursor", "pointer")
        .style("border-radius", "4px")
        .style("border", "1px solid #ccc");

    brandSelect.append("option")
        .attr("value", "All brands")
        .text("All brands");

    brandSelect.selectAll("option.brand")
        .data(brands)
        .enter()
        .append("option")
        .attr("class", "brand")
        .attr("value", d => d)
        .text(d => d);

    const color = d3.scaleOrdinal()
        .domain(brands)
        .range(d3.schemeTableau10);

    const legendDiv = controls.append("div")
        .style("display", "flex")
        .style("gap", "1rem")
        .style("flex-wrap", "wrap")
        .style("align-items", "center");

    legendDiv.append("span")
        .style("font-weight", "bold")
        .style("margin-right", "0.5rem")
        .text("Brands: ");

    brands.forEach(brand => {
        const item = legendDiv.append("div")
            .style("display", "flex")
            .style("align-items", "center")
            .style("gap", "0.3rem")
            .style("font-size", "12px");

        item.append("div")
            .style("width", "12px")
            .style("height", "12px")
            .style("background-color", color(brand))
            .style("border-radius", "2px");

        item.append("span")
            .text(brand);
    });

    const chartDiv = container.append("div")
        .style("position", "relative");

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const x = d3.scalePoint()
        .domain(dimensions.map(d => d.key))
        .range([margin.left, width - margin.right])
        .padding(0.5);

    const y = {};
    for (const dim of dimensions) {
        const values = brandMetrics.map(d => d[dim.key]).filter(v => v != null);
        const extent = d3.extent(values);
        y[dim.key] = d3.scaleLinear()
            .domain(extent)
            .nice()
            .range([innerHeight + margin.top, margin.top]);
    }

    const line = d3.line()
        .defined(([, value]) => value != null)
        .x(([key]) => x(key))
        .y(([key, value]) => y[key](value));

    function path(d) {
        return line(dimensions.map(dim => [dim.key, d[dim.key]]));
    }

    const svg = chartDiv.append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("background", "#fafbff")
        .style("border-radius", "6px")
        .style("display", "block")
        .style("margin", "0 auto");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.top - 20)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "800")
        .style("fill", "#1f3b70")
        .text("Which brands are most sustainable per production unit?");

    const foreground = svg.append("g")
        .attr("class", "foreground")
        .attr("fill", "none")
        .attr("stroke-width", 2.2)
        .attr("stroke-opacity", 0.6);

    const lines = foreground.selectAll("path")
        .data(brandMetrics)
        .join("path")
        .attr("d", d => path(d))
        .attr("stroke", d => color(d.Brand))
        .style("cursor", "pointer");

    const tooltip = chartDiv.append("div")
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("background", "rgba(0,0,0,0.85)")
        .style("color", "#fff")
        .style("padding", "6px 8px")
        .style("border-radius", "4px")
        .style("font-size", "11px")
        .style("opacity", 0)
        .style("z-index", "1000");

    lines
        .on("mouseenter", function(event, d) {
            lines
                .attr("stroke-opacity", l => (l === d ? 1 : 0.1))
                .attr("stroke-width", l => (l === d ? 3 : 1.5));

            tooltip
                .style("opacity", 1)
                .html(`
                    <div><b>${d.Brand}</b></div>
                    <div>Carbon/tonne: ${d3.format(".2f")(d.carbonPerTonne)} tCO₂e</div>
                    <div>Water/tonne: ${d3.format(".3f")(d.waterPerTonne)} M litres</div>
                    <div>Env cost index: ${d3.format(".2f")(d.Env_Cost_Index)}</div>
                    <div>Sustainability: ${d3.format(".2f")(d.Sustainability_Score)}</div>
                    <div>Transparency: ${d3.format(".2f")(d.Transparency_Index)}</div>
                    <div>Ethical rating: ${d3.format(".2f")(d.Ethical_Rating)}</div>
                `);
        })
        .on("mousemove", function(event) {
            const containerRect = chartDiv.node().getBoundingClientRect();
            tooltip
                .style("left", (event.pageX - containerRect.left + 10) + "px")
                .style("top", (event.pageY - containerRect.top + 10) + "px");
        })
        .on("mouseleave", function() {
            lines
                .attr("stroke-opacity", 0.6)
                .attr("stroke-width", 2.2);
            tooltip.style("opacity", 0);
        });

    const brushSelections = {};

    dimensions.forEach(dim => {
        const g = svg.append("g")
            .attr("transform", `translate(${x(dim.key)},0)`);

        g.append("g")
            .call(d3.axisLeft(y[dim.key]).ticks(5))
            .style("font-size", "10px");

        g.append("text")
            .attr("y", margin.top - 5)
            .attr("text-anchor", "middle")
            .style("font-size", "11px")
            .style("font-weight", "bold")
            .style("fill", "#333")
            .text(dim.label);

        const brush = d3.brushY()
            .extent([[-14, margin.top], [14, innerHeight + margin.top]])
            .on("brush end", brushed);

        g.append("g")
            .attr("class", "brush")
            .call(brush);

        function brushed(event) {
            const sel = event.selection;
            if (!sel) {
                delete brushSelections[dim.key];
            } else {
                const [y0, y1] = sel;
                brushSelections[dim.key] = [
                    y[dim.key].invert(y1),
                    y[dim.key].invert(y0)
                ].sort((a, b) => a - b);
            }

            lines.attr("stroke-opacity", d => {
                for (const key in brushSelections) {
                    const [min, max] = brushSelections[key];
                    const v = d[key];
                    if (v == null || v < min || v > max) return 0.05;
                }
                return 0.9;
            });
        }
    });

    brandSelect.on("change", function() {
        const val = d3.select(this).property("value");
        lines
            .attr("stroke-width", d => (val === "All brands" || d.Brand === val ? 3 : 1.5))
            .attr("stroke-opacity", d => (val === "All brands" || d.Brand === val ? 0.95 : 0.2));
    });
}