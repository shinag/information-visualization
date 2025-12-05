// Environmental Cost Efficiency Over Time - Heatmap
function initQ9(data) {
    const container = d3.select("#q9-chart");

    const margin = { top: 80, right: 30, bottom: 100, left: 100 };
    const width = 800;
    const height = 550;
    const inner_width = width - margin.left - margin.right;
    const inner_height = height - margin.top - margin.bottom;

    const to_class = str => `cls_${str}`.replace(/\W/g, "");

    const raw_matrix = d3.rollups(
        data,
        v => d3.mean(v, d => +d.Env_Cost_Index || 0),
        d => d.Brand,
        d => d.Year
    );

    let heatmap_data = [];
    let brand_volatility = {};

    raw_matrix.forEach(([brand, years]) => {
        const values = years.map(d => d[1]);
        const avg = d3.mean(values);
        const max_dev = d3.max(values.map(v => Math.abs(v - avg)));
        brand_volatility[brand] = d3.mean(values.map(v => Math.abs(v - avg) / (avg || 1)));

        years.forEach(([year, value]) => {
            heatmap_data.push({
                brand: brand,
                year: year,
                value: value,
                percent: avg ? (value - avg) / avg : 0,
                score: max_dev ? (value - avg) / max_dev : 0
            });
        });
    });

    const brands_alpha = Array.from(new Set(heatmap_data.map(d => d.brand))).sort();
    const brands_volatile = [...brands_alpha].sort((a, b) => brand_volatility[b] - brand_volatility[a]);
    const years = Array.from(new Set(heatmap_data.map(d => d.year))).sort((a, b) => a - b);

    const x_scale = d3.scaleBand().domain(years).range([0, inner_width]).padding(0.05);
    const y_scale = d3.scaleBand().domain(brands_volatile).range([0, inner_height]).padding(0.05);
    const color_scale = d3.scaleSequential(d3.interpolateReds).domain([-1, 1]);

    const header = container.append("div")
        .style("height", "40px")
        .style("display", "flex")
        .style("align-items", "center")
        .style("justify-content", "center")
        .style("background", "#f9f9f9")
        .style("border-bottom", "1px solid #ddd")
        .style("margin-bottom", "10px");

    const header_text = header.append("div")
        .style("font-size", "14px")
        .style("color", "#555")
        .html("Hover over the grid to analyze Environmental Cost efficiency.");

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("display", "block")
        .style("margin", "0 auto");

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x_axis_g = g.append("g")
        .attr("transform", `translate(0,${inner_height})`);
    const y_axis_g = g.append("g");

    function draw_axes() {
        x_axis_g.call(d3.axisBottom(x_scale).tickFormat(d3.format("d")))
            .call(g => g.select(".domain").remove())
            .selectAll("text")
            .style("cursor", "pointer")
            .style("font-size", "12px")
            .attr("class", d => to_class(d))
            .on("mouseover", (event, d) => highlight("col", d))
            .on("mouseleave", reset_highlight);

        y_axis_g.call(d3.axisLeft(y_scale))
            .call(g => g.select(".domain").remove())
            .selectAll("text")
            .style("cursor", "pointer")
            .style("font-size", "11px")
            .style("font-weight", "bold")
            .attr("class", d => to_class(d))
            .on("mouseover", (event, d) => highlight("row", d))
            .on("mouseleave", reset_highlight);
    }
    draw_axes();

    const squares = g.selectAll("rect.square")
        .data(heatmap_data, d => d.brand + d.year)
        .join("rect")
        .attr("class", d => `square ${to_class(d.brand)} ${to_class(d.year)}`)
        .attr("x", d => x_scale(d.year))
        .attr("y", d => y_scale(d.brand))
        .attr("width", x_scale.bandwidth())
        .attr("height", y_scale.bandwidth())
        .attr("fill", d => color_scale(d.score))
        .attr("rx", 4)
        .attr("ry", 4)
        .style("transition", "opacity 0.2s");

    function highlight(type, key) {
        g.selectAll(".square").style("opacity", 0.15);
        g.selectAll(".tick text").style("opacity", 0.3);

        if (type === "square") {
            g.selectAll(`.${to_class(key.brand)}`).style("opacity", 1);
            g.selectAll(`.${to_class(key.year)}`).style("opacity", 1);
            y_axis_g.select(`.${to_class(key.brand)}`).style("opacity", 1).style("font-weight", "900");
            x_axis_g.select(`.${to_class(key.year)}`).style("opacity", 1).style("font-weight", "900");

            const percent_val = (key.percent * 100).toFixed(1);
            const trend_text = key.percent > 0 ? "HIGHER" : "LOWER";
            const value_text = key.value.toFixed(2);
            const color_hex = "#a50f15";

            header_text.html(`
                <span style="font-weight:bold; color:black;">${key.brand}</span> in 
                <span style="font-weight:bold; color:black;">${key.year}</span> had a Cost Index of 
                <span style="font-weight:bold; color:black;">${value_text}</span> 
                <span style="color:#888;">|</span> 
                <span style="font-weight:bold; color:${color_hex};">${Math.abs(percent_val)}% ${trend_text}</span> 
                than its average.
            `);

        } else if (type === "row") {
            g.selectAll(`.${to_class(key)}`).style("opacity", 1);
            y_axis_g.select(`.${to_class(key)}`).style("opacity", 1).style("font-weight", "900");
            header_text.html(`Analyzing Cost Index history for <span style="font-weight:bold;">${key}</span>`);

        } else if (type === "col") {
            g.selectAll(`.${to_class(key)}`).style("opacity", 1);
            x_axis_g.select(`.${to_class(key)}`).style("opacity", 1).style("font-weight", "900");
            header_text.html(`Comparing all brands in <span style="font-weight:bold;">${key}</span>`);
        }
    }

    function reset_highlight() {
        g.selectAll(".square").style("opacity", 1);
        g.selectAll(".tick text").style("opacity", 1).style("font-weight", "bold");
        header_text.html("Hover over the grid to analyze Environmental Cost efficiency.");
    }

    squares.on("mouseover", (event, d) => {
            highlight("square", d);
            d3.select(event.currentTarget).attr("stroke", "#333").attr("stroke-width", 2);
        })
        .on("mouseleave", (event, d) => {
            d3.select(event.currentTarget).attr("stroke", "none");
            reset_highlight();
        });

    const legend_width = 300;
    const legend_height = 15;
    const legend_x = (inner_width - legend_width) / 2;
    const legend_y = inner_height + 50;

    const defs = svg.append("defs");
    const linear_gradient = defs.append("linearGradient")
        .attr("id", "legend-gradient-q9");

    linear_gradient.selectAll("stop")
        .data([
            { offset: "0%", color: d3.interpolateReds(0) },
            { offset: "50%", color: d3.interpolateReds(0.5) },
            { offset: "100%", color: d3.interpolateReds(1) }
        ])
        .enter().append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);

    const legend = g.append("g")
        .attr("transform", `translate(${legend_x}, ${legend_y})`);

    legend.append("rect")
        .attr("width", legend_width)
        .attr("height", legend_height)
        .style("fill", "url(#legend-gradient-q9)")
        .attr("rx", 3)
        .attr("stroke", "#ccc");

    legend.append("text")
        .attr("x", 0).attr("y", 30)
        .style("font-size", "11px")
        .style("font-weight", "bold")
        .style("fill", "#666")
        .text("Below Avg (-)");

    legend.append("text")
        .attr("x", legend_width / 2).attr("y", 30)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", "#666")
        .text("Average");

    legend.append("text")
        .attr("x", legend_width).attr("y", 30)
        .attr("text-anchor", "end")
        .style("font-size", "11px")
        .style("font-weight", "bold")
        .style("fill", "#a50f15")
        .text("Above Avg (+)");
}