// Brand Carbon Emissions - Animated Bar Chart with Country Filter
function initQ1(data) {
    const countries = Array.from(new Set(data.map(d => d.Country))).sort();
    
    const container = d3.select("#q1-chart");
    
    const selectorDiv = container.append("div")
        .style("margin-bottom", "20px")
        .style("text-align", "center");
    
    const label = selectorDiv.append("label")
        .style("font-weight", "bold")
        .style("margin-right", "10px")
        .text("Select Country: ");
    
    const select = selectorDiv.append("select")
        .style("padding", "8px")
        .style("font-size", "14px");
    
    select.append("option")
        .attr("value", "all")
        .text("All Countries");
    
    select.selectAll("option.country")
        .data(countries)
        .enter()
        .append("option")
        .attr("class", "country")
        .attr("value", d => d)
        .text(d => d);
    
    const buttonDiv = container.append("div")
        .style("margin-bottom", "20px")
        .style("text-align", "center");
    
    const autoPlayBtn = buttonDiv.append("button")
        .text("▶ Loop Through")
        .style("padding", "8px 16px")
        .style("font-size", "14px")
        .style("cursor", "pointer")
        .style("margin-right", "10px")
        .style("background-color", "#69b3a2")
        .style("color", "white")
        .style("border", "none")
        .style("border-radius", "4px")
        .style("transition", "all 0.3s");
    
    let autoPlayInterval = null;
    let countryIndex = 0;
    let isPlaying = false;

    autoPlayBtn.on("click", function() {
        if (isPlaying) {
            clearInterval(autoPlayInterval);
            autoPlayBtn.text("▶ Loop Through");
            autoPlayBtn.style("background-color", "#69b3a2");
            isPlaying = false;
        } else {
            isPlaying = true;
            autoPlayBtn.text("⏸ Pause");
            autoPlayBtn.style("background-color", "#e63946");
            
            autoPlayInterval = setInterval(() => {
                countryIndex = (countryIndex + 1) % countries.length;
                select.property("value", countries[countryIndex]);
                updateChart(countries[countryIndex]);
            }, 2500);
            
            updateChart(countries[countryIndex]);
        }
    });
    
    const chartDiv = container.append("div")
        .style("display", "flex")
        .style("justify-content", "center");
    
    function updateChart(country) {
        const width = 800;
        const height = 420;
        const margin = { top: 30, right: 20, bottom: 80, left: 80 };

        let filtered = data;
        if (country !== "all") {
            filtered = data.filter(d => d.Country === country);
        }
        
        if (filtered.length === 0) {
            chartDiv.html(`<p>No data for ${country}</p>`);
            return;
        }

        const brandTotals = d3.rollups(
            filtered,
            v => ({
                carbon: d3.sum(v, d => d.Carbon_Emissions_tCO2e),
                water: d3.sum(v, d => d.Water_Usage_Million_Litres),
                production: d3.sum(v, d => d.Monthly_Production_Tonnes),
                waste: d3.sum(v, d => d.Landfill_Waste_Tonnes)
            }),
            d => d.Brand
        ).map(([Brand, vals]) => ({
            Brand,
            ...vals,
            carbonPerTon: vals.carbon / vals.production
        }));

        const dataSorted = brandTotals
            .slice()
            .sort((a, b) => d3.descending(a.carbon, b.carbon))
            .slice(0, 15);

        const x = d3.scaleBand()
            .domain(dataSorted.map(d => d.Brand))
            .range([margin.left, width - margin.right])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, d3.max(dataSorted, d => d.carbon) || 0])
            .nice()
            .range([height - margin.bottom, margin.top]);

        const colorScale = d3.scaleSequential()
            .domain([0, d3.max(dataSorted, d => d.carbon)])
            .interpolator(d3.interpolateReds);

        let svg = chartDiv.select("svg");
        
        if (svg.empty()) {
            svg = chartDiv.append("svg")
                .attr("width", width)
                .attr("height", height);
        }

        const tooltip = d3.select("body")
            .selectAll(".tooltip-q1")
            .data([null])
            .join("div")
            .attr("class", "tooltip tooltip-q1")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background-color", "rgba(255, 255, 255, 0.98)")
            .style("border", "1px solid #aaa")
            .style("border-radius", "6px")
            .style("padding", "12px")
            .style("font-size", "12px")
            .style("box-shadow", "0 4px 12px rgba(0,0,0,0.2)")
            .style("pointer-events", "none")
            .style("z-index", "1000");

        svg.selectAll("rect.bar")
            .data(dataSorted, d => d.Brand)
            .join(
                enter => enter.append("rect")
                    .attr("class", "bar")
                    .attr("x", d => x(d.Brand))
                    .attr("y", height - margin.bottom)
                    .attr("width", x.bandwidth())
                    .attr("height", 0)
                    .attr("fill", d => colorScale(d.carbon))
                    .style("cursor", "pointer")
                    .call(enter => enter.transition()
                        .duration(750)
                        .delay((d, i) => i * 50)
                        .attr("y", d => y(d.carbon))
                        .attr("height", d => height - margin.bottom - y(d.carbon))
                    ),
                update => update
                    .call(update => update.transition()
                        .duration(750)
                        .attr("x", d => x(d.Brand))
                        .attr("y", d => y(d.carbon))
                        .attr("width", x.bandwidth())
                        .attr("height", d => height - margin.bottom - y(d.carbon))
                        .attr("fill", d => colorScale(d.carbon))
                    ),
                exit => exit
                    .call(exit => exit.transition()
                        .duration(500)
                        .attr("y", height - margin.bottom)
                        .attr("height", 0)
                        .remove()
                    )
            )
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("opacity", 0.7);
                
                tooltip.style("visibility", "visible")
                    .html(`
                        <div style="font-weight: bold; font-size: 14px; margin-bottom: 6px; border-bottom: 1px solid #eee; padding-bottom:4px;">${d.Brand}</div>
                        <div style="margin-bottom: 4px;">
                            Carbon: <b>${d.carbon.toLocaleString()} tCO₂e</b>
                        </div>
                        <div style="margin-bottom: 4px;">
                            Water: <b>${d.water.toLocaleString()} ML</b>
                        </div>
                        <div style="margin-bottom: 4px;">
                            Waste: <b>${d.waste.toLocaleString()} tonnes</b>
                        </div>
                        <div style="color: #666; font-size: 11px; padding-top: 6px; border-top: 1px solid #eee;">
                            Efficiency: <b>${d.carbonPerTon.toFixed(2)}</b> per tonne
                        </div>
                    `);
            })
            .on("mousemove", function(event) {
                tooltip
                    .style("top", (event.pageY + 15) + "px")
                    .style("left", (event.pageX + 15) + "px");
            })
            .on("mouseout", function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("opacity", 1);
                
                tooltip.style("visibility", "hidden");
            });

        svg.selectAll(".x-axis").remove();
        svg.selectAll(".y-axis").remove();
        svg.selectAll(".title").remove();
        svg.selectAll(".y-label").remove();
        svg.selectAll(".x-label").remove();

        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-35)")
            .style("text-anchor", "end")
            .style("font-size", "11px");

        svg.append("g")
            .attr("class", "y-axis")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).tickFormat(d => d.toLocaleString()));

        const titleText = country === "all" 
            ? "Top 15 Brands by Carbon Emissions - All Countries"
            : `Top 15 Brands by Carbon Emissions - ${country}`;

        svg.append("text")
            .attr("class", "title")
            .attr("x", width/2)
            .attr("y", margin.top - 10)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text(titleText);

        svg.append("text")
            .attr("class", "y-label")
            .attr("transform", "rotate(-90)") 
            .attr("y", margin.left - 60)      
            .attr("x", -height / 2)           
            .attr("text-anchor", "middle")    
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text("Carbon Emissions (tCO₂e)");

        svg.append("text")
            .attr("class", "x-label")
            .attr("x", width / 2)
            .attr("y", height - margin.bottom + 60) 
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text("Brand");
    }

    updateChart("all");

    select.on("change", function() {
        const value = d3.select(this).property("value");
        
        if (isPlaying) {
            clearInterval(autoPlayInterval);
            autoPlayBtn.text("▶ Loop Through");
            autoPlayBtn.style("background-color", "#69b3a2");
            isPlaying = false;
        }
        
        if (value === "all") {
            countryIndex = 0;
            updateChart("all");
        } else {
            countryIndex = countries.indexOf(value);
            updateChart(value);
        }
    });
}