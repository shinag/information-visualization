// Economic Impact vs Environmental Responsibility - Scatter Plot
function initQ6(data) {
    const container = d3.select("#q6-chart");

    const w = 800;
    const h = 550;
    const margin = { top: 40, right: 40, bottom: 80, left: 70 };

    const brand_data = d3.rollups(
        data,
        v => {
            const carbon = d3.sum(v, d => d.Carbon_Emissions_tCO2e);
            const production = d3.sum(v, d => d.Monthly_Production_Tonnes);
            const gdp_total = d3.sum(v, d => {
                const val = d.GDP_Contribution_Million_USD || 0;
                return typeof val === "string" ? +val.replace(/[^0-9.]/g, "") : +val;
            });
            const sustainability = d3.mean(v, d => +d.Sustainability_Score);

            return {
                brand: v[0].Brand,
                gdp_total,
                sustainability,
                carbon_intensity: production > 0 ? carbon / production : 0,
                production
            };
        },
        d => d.Brand
    )
    .map(([_, v]) => v)
    .filter(d => d.production > 0);

    const y_options = [
        {
            key: "sustainability",
            label: "Sustainability Score",
            axis_label: "↑ Sustainability Score (Higher is Better)",
            quadrants: () => ({
                top_right: "High GDP &\nHigh Sustainability",
                top_left: "Low GDP &\nHigh Sustainability",
                bottom_right: "High GDP &\nLow Sustainability",
                bottom_left: "Low GDP &\nLow Sustainability"
            })
        },
        {
            key: "carbon_intensity",
            label: "Carbon Intensity",
            axis_label: "↓ Carbon per Ton (Lower is Better)",
            quadrants: () => ({
                bottom_right: "High GDP &\nLow Emissions",
                bottom_left: "Low GDP &\nLow Emissions",
                top_right: "High GDP &\nHigh Emissions",
                top_left: "Low GDP &\nHigh Emissions"
            })
        }
    ];

    let y_selected = y_options[0];

    function trend_line(data, x_key, y_key) {
        const n = data.length;
        const sum_x = d3.sum(data, d => d[x_key]);
        const sum_y = d3.sum(data, d => d[y_key]);
        const sum_xy = d3.sum(data, d => d[x_key] * d[y_key]);
        const sum_x2 = d3.sum(data, d => d[x_key] ** 2);

        const denom = n * sum_x2 - sum_x ** 2;
        if (denom === 0) return { m: 0, b: 0 };

        const m = (n * sum_xy - sum_x * sum_y) / denom;
        const b = (sum_y - m * sum_x) / n;
        return { m, b };
    }

    const title_block = container.append("div")
        .style("text-align", "center")
        .style("margin-bottom", "10px");

    title_block.append("h3")
        .style("font-size", "20px")
        .style("margin", "10px 0 5px 0")
        .text("Economic Impact vs Environmental Responsibility");

    const subtitle = title_block.append("div")
        .style("color", "#666")
        .style("font-size", "12px")
        .style("font-style", "italic");

    const controls = container.append("div")
        .style("display", "flex")
        .style("gap", "20px")
        .style("margin-bottom", "15px")
        .style("justify-content", "center");

    const y_control = controls.append("div")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("align-items", "center");

    y_control.append("div")
        .style("font-size", "11px")
        .style("color", "#666")
        .style("margin-bottom", "6px")
        .style("font-weight", "600")
        .text("SELECT ENVIRONMENTAL METRIC");

    const y_buttons_group = y_control.append("div")
        .style("background", "#eee")
        .style("padding", "4px")
        .style("border-radius", "8px")
        .style("display", "flex")
        .style("gap", "4px");

    const y_buttons = y_buttons_group.selectAll("button")
        .data(y_options)
        .join("button")
        .text(d => d.label)
        .style("padding", "8px 20px")
        .style("border-radius", "6px")
        .style("border", "none")
        .style("cursor", "pointer")
        .style("font-size", "12px")
        .style("font-weight", "600")
        .on("click", (_, d) => {
            y_selected = d;
            update();
        });

    const tooltip = d3.select("body")
        .selectAll(".tooltip-q6")
        .data([null])
        .join("div")
        .attr("class", "tooltip tooltip-q6")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "white")
        .style("border", "1px solid #333")
        .style("padding", "12px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("z-index", "1000");

    const svg = container.append("svg")
        .attr("width", w)
        .attr("height", h)
        .style("display", "block")
        .style("margin", "0 auto");

    const x_scale = d3.scaleLinear().range([margin.left, w - margin.right]);
    const y_scale = d3.scaleLinear().range([h - margin.bottom, margin.top]);
    const color = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(brand_data.map(d => d.brand));

    const quadrant_layer = svg.append("g");
    const trend_layer = svg.append("g");
    const dot_layer = svg.append("g");
    const label_layer = svg.append("g");
    const axis_layer = svg.append("g");

    const x_axis = axis_layer.append("g")
        .attr("transform", `translate(0,${h - margin.bottom})`);
    const y_axis = axis_layer.append("g")
        .attr("transform", `translate(${margin.left},0)`);

    const x_axis_label = svg.append("text")
        .attr("x", w / 2)
        .attr("y", h - 15)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .text("GDP Contribution (Million USD) →");

    const y_axis_label = svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -h / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "bold");

    function update() {
        const x_key = "gdp_total";
        const y_key = y_selected.key;
        const quadrant_text = y_selected.quadrants();

        y_buttons
            .style("background", d => d.key === y_key ? "#2196F3" : "transparent")
            .style("color", d => d.key === y_key ? "white" : "#666");

        const x_ext = d3.extent(brand_data, d => d[x_key]);
        const y_ext = d3.extent(brand_data, d => d[y_key]);

        const x_pad = (x_ext[1] - x_ext[0]) * 0.15;
        const y_pad = (y_ext[1] - y_ext[0]) * 0.15;

        x_scale.domain([x_ext[0] - x_pad, x_ext[1] + x_pad]);
        y_scale.domain([y_ext[0] - y_pad, y_ext[1] + y_pad]).nice();

        const mid_x = (x_scale.domain()[0] + x_scale.domain()[1]) / 2;
        const mid_y = (y_scale.domain()[0] + y_scale.domain()[1]) / 2;

        quadrant_layer.selectAll("*").remove();

        quadrant_layer.append("line")
            .attr("x1", x_scale(mid_x)).attr("y1", margin.top)
            .attr("x2", x_scale(mid_x)).attr("y2", h - margin.bottom)
            .attr("stroke", "#999")
            .attr("stroke-dasharray", "5,5");

        quadrant_layer.append("line")
            .attr("x1", margin.left).attr("y1", y_scale(mid_y))
            .attr("x2", w - margin.right).attr("y2", y_scale(mid_y))
            .attr("stroke", "#999")
            .attr("stroke-dasharray", "5,5");

        x_axis.transition().duration(800).call(d3.axisBottom(x_scale).ticks(6, "s"));
        y_axis.transition().duration(800).call(d3.axisLeft(y_scale).ticks(6));
        y_axis_label.text(y_selected.axis_label);

        const trend = trend_line(brand_data, x_key, y_key);
        const trend_points = [
            { x: x_scale.domain()[0], y: trend.m * x_scale.domain()[0] + trend.b },
            { x: x_scale.domain()[1], y: trend.m * x_scale.domain()[1] + trend.b }
        ];

        trend_layer.selectAll("path")
            .data([trend_points])
            .join("path")
            .transition()
            .duration(800)
            .attr("d", d3.line().x(d => x_scale(d.x)).y(d => y_scale(d.y)))
            .attr("stroke", "#333")
            .attr("stroke-dasharray", "2,2")
            .attr("stroke-width", 2)
            .attr("opacity", 0.5)
            .attr("fill", "none");

        dot_layer.selectAll("circle")
            .data(brand_data, d => d.brand)
            .join(
                enter => enter.append("circle")
                    .attr("cx", d => x_scale(d[x_key]))
                    .attr("cy", y_scale(mid_y))
                    .attr("r", 0)
                    .attr("fill", d => color(d.brand))
                    .attr("stroke", "white")
                    .attr("stroke-width", 2)
                    .style("cursor", "pointer")
                    .call(enter => enter.transition()
                        .duration(800)
                        .attr("cy", d => y_scale(d[y_key]))
                        .attr("r", 18)
                    ),
                update => update.transition().duration(800)
                    .attr("cx", d => x_scale(d[x_key]))
                    .attr("cy", d => y_scale(d[y_key]))
            )
            .on("mouseover", (event, d) => {
                tooltip.style("visibility", "visible")
                    .html(`
                        <div style="font-weight:900;margin-bottom:5px">${d.brand}</div>
                        GDP: $${d3.format(",.0f")(d[x_key])}M<br>
                        ${y_selected.label}: ${d[y_key].toFixed(2)}<br>
                        Production: ${d3.format(",")(d.production)} tons
                    `);
            })
            .on("mousemove", event => {
                tooltip
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", event.pageY + "px");
            })
            .on("mouseout", () => tooltip.style("visibility", "hidden"));

        label_layer.selectAll("text")
            .data(brand_data, d => d.brand)
            .join("text")
            .transition()
            .duration(800)
            .attr("x", d => x_scale(d[x_key]))
            .attr("y", d => y_scale(d[y_key]) - 22)
            .attr("text-anchor", "middle")
            .style("font-size", "11px")
            .style("font-weight", "bold")
            .text(d => d.brand);
    }

    update();
}