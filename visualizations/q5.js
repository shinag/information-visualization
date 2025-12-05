function initQ5(data) {
  const width = 1000;
  const height = 650;
  const margin = { top: 40, right: 40, bottom: 80, left: 100 };

  const countryTotals = d3.rollups(
    data,
    v => ({
      carbon: d3.sum(v, d => d.Carbon_Emissions_tCO2e),
      water: d3.sum(v, d => d.Water_Usage_Million_Litres),
      waste: d3.sum(v, d => d.Landfill_Waste_Tonnes),
      production: d3.sum(v, d => d.Monthly_Production_Tonnes)
    }),
    d => d.Country
  ).map(([Country, vals]) => ({ 
    Country, 
    ...vals
  }));

  const originalOrder = countryTotals.map(d => d.Country).sort();

  let currentMetric = 'carbon';
  let currentSort = 'original'; 
  let selectedCountry = null;

  const metricOptions = {
    carbon: { label: 'Carbon Emissions', unit: 'tCO₂e', color: '#e74c3c' },      
    water: { label: 'Water Usage', unit: 'Million Litres', color: '#3498db' },   
    waste: { label: 'Landfill Waste', unit: 'tonnes', color: '#95a5a6' }        
  };

  const formatTotal = val => {
    if (val >= 1000000) return (val/1000000).toFixed(2) + "M"; 
    if (val >= 1000) return (val/1000).toFixed(0) + "k";
    return val.toFixed(0);
  };

  const formatRatio = (val, production) => {
    if (!production) return "";
    const ratio = val / production;
    const decimals = currentMetric === 'water' ? 2 : 1; 
    return ratio.toFixed(decimals);
  };

  const formatTooltip = val => val.toLocaleString(); 

  const container = d3.select("#q5-chart")
    .style("font-family", "sans-serif")
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("align-items", "center")
    .style("position", "relative"); 

  container.append("h2")
    .text("Environmental Impact by Country")
    .style("margin", "10px 0 5px 0")
    .style("font-size", "22px");
    
  const subtitle = container.append("div")
    .style("color", "#666")
    .style("font-size", "14px")
    .style("margin-bottom", "20px")
    .text("Showing: Total Impact (Efficiency per Tonne)");
  
  const controls = container.append("div")
    .style("display", "flex")
    .style("gap", "20px")
    .style("align-items", "center")
    .style("background", "#f8f9fa")
    .style("padding", "8px 16px")
    .style("border-radius", "50px") 
    .style("border", "1px solid #eee")
    .style("box-shadow", "0 2px 8px rgba(0,0,0,0.05)")
    .style("margin-bottom", "10px");

  const metricGroup = controls.append("div").style("display", "flex").style("gap", "5px");
  const metricButtons = metricGroup.selectAll("button")
    .data(Object.keys(metricOptions))
    .join("button")
    .text(d => metricOptions[d].label)
    .style("padding", "8px 16px")
    .style("border", "none")
    .style("border-radius", "20px")
    .style("cursor", "pointer")
    .style("font-size", "13px")
    .style("font-weight", "600")
    .style("transition", "all 0.2s ease")
    .on("click", (e, d) => {
      currentMetric = d;
      selectedCountry = null;
      updateChart();
    });

  controls.append("div").style("width", "1px").style("height", "24px").style("background", "#ddd");

  const sortGroup = controls.append("div").style("display", "flex").style("gap", "5px");
  const sortOptions = [
    { key: 'desc', label: 'Highest Total ↓' },
    { key: 'asc', label: 'Lowest Total ↑' },
    { key: 'original', label: 'Reset' }
  ];

  const sortButtons = sortGroup.selectAll("button")
    .data(sortOptions)
    .join("button")
    .text(d => d.label)
    .style("padding", "8px 12px")
    .style("border", "1px solid transparent")
    .style("border-radius", "6px")
    .style("background", "transparent")
    .style("cursor", "pointer")
    .style("font-size", "12px")
    .style("color", "#555")
    .style("transition", "all 0.2s ease")
    .on("click", (e, d) => {
      currentSort = d.key;
      updateChart();
    });

  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "white");

  const tooltip = container.append("div")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background-color", "rgba(255, 255, 255, 0.98)")
    .style("border", "1px solid #aaa")
    .style("border-radius", "6px")
    .style("padding", "12px")
    .style("font-size", "12px")
    .style("line-height", "1.4")
    .style("box-shadow", "0 4px 12px rgba(0,0,0,0.2)")
    .style("pointer-events", "none") 
    .style("z-index", "1000")
    .style("min-width", "180px");

  const x = d3.scaleBand().range([margin.left, width - margin.right]).padding(0.3);
  const y = d3.scaleLinear().range([height - margin.bottom, margin.top]);

  const xAxisGroup = svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`);
  const yAxisGroup = svg.append("g").attr("transform", `translate(${margin.left},0)`);
  const barsGroup = svg.append("g");
   
  const gridGroup = svg.append("g").attr("class", "grid")
    .attr("transform", `translate(${margin.left},0)`)
    .style("stroke-dasharray", "4,4")
    .style("stroke-opacity", 0.1);

  const yLabel = svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(height - margin.bottom + margin.top) / 2)
    .attr("y", margin.left / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .style("fill", "#333");

  svg.append("text")
    .attr("x", (width - margin.left - margin.right) / 2 + margin.left)
    .attr("y", height - 25)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .style("fill", "#333")
    .text("Region / Country");

  function updateChart() {
    const metric = metricOptions[currentMetric];
    metricButtons
      .style("background", d => d === currentMetric ? metric.color : "transparent")
      .style("color", d => d === currentMetric ? "white" : "#555")
      .style("box-shadow", d => d === currentMetric ? "0 2px 4px rgba(0,0,0,0.2)" : "none");

    sortButtons
      .style("font-weight", d => d.key === currentSort ? "bold" : "normal")
      .style("background", d => d.key === currentSort ? "#e0e0e0" : "transparent");

    if (currentSort === 'desc') {
      countryTotals.sort((a, b) => d3.descending(a[currentMetric], b[currentMetric]));
    } else if (currentSort === 'asc') {
      countryTotals.sort((a, b) => d3.ascending(a[currentMetric], b[currentMetric]));
    } else {
      countryTotals.sort((a, b) => originalOrder.indexOf(a.Country) - originalOrder.indexOf(b.Country));
    }

    x.domain(countryTotals.map(d => d.Country));
    y.domain([0, d3.max(countryTotals, d => d[currentMetric]) * 1.2]).nice(); 
    subtitle.text(`Total ${metric.label} (and Efficiency per Tonne)`);
    yLabel.text(`${metric.label} (${metric.unit})`);

    const t = svg.transition().duration(750);
    xAxisGroup.transition(t).call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-30)")
      .style("text-anchor", "end")
      .style("font-size", "11px");

    yAxisGroup.transition(t).call(d3.axisLeft(y).ticks(8, "s"));
    
    gridGroup.transition(t)
      .call(d3.axisLeft(y).tickSize(-width + margin.left + margin.right).tickFormat(""))
      .call(g => g.select(".domain").remove());
    
    const bars = barsGroup.selectAll("rect")
      .data(countryTotals, d => d.Country);

    const barsEnter = bars.enter().append("rect")
      .attr("rx", 4) 
      .style("cursor", "pointer")
      .attr("y", height - margin.bottom)
      .attr("height", 0);

    barsEnter.merge(bars)
      .transition(t)
      .attr("x", d => x(d.Country))
      .attr("width", x.bandwidth())
      .attr("y", d => y(d[currentMetric]))
      .attr("height", d => height - margin.bottom - y(d[currentMetric]))
      .attr("fill", d => selectedCountry && selectedCountry !== d.Country ? d3.color(metric.color).copy({opacity: 0.3}) : metric.color);

    barsGroup.selectAll("rect")
      .on("mouseover", function(event, d) {
          const baseColor = selectedCountry && selectedCountry !== d.Country ? d3.color(metric.color).copy({opacity: 0.3}) : metric.color;
          d3.select(this).attr("fill", d3.color(baseColor).darker(0.5));

          const ratio = (d[currentMetric] / d.production).toFixed(2);

          tooltip.html(`
              <div style="font-weight: bold; font-size: 14px; margin-bottom: 6px; border-bottom: 1px solid #eee; padding-bottom:4px;">${d.Country}</div>
              <div style="margin-bottom: 8px; font-size: 13px;">
                 <span style="display:inline-block; width: 10px; height: 10px; background-color:${metric.color}; margin-right: 6px; border-radius: 50%;"></span>
                 ${metric.label}: <b>${formatTooltip(d[currentMetric])}</b>
              </div>
              <div style="font-size: 12px; color: #555; margin-bottom: 8px;">
                 Production: <b>${formatTooltip(d.production)} tonnes</b>
              </div>
              <div style="color: #666; font-size: 11px; padding-top: 6px; border-top: 1px solid #eee; background: #fafafa; padding: 4px; border-radius: 4px;">
                 Efficiency: <b>${ratio}</b> per tonne produced
              </div>
          `);
          tooltip.style("visibility", "visible");
          
          const [mx, my] = d3.pointer(event, container.node());
          let left = mx + 20;
          if (left + 180 > width) left = mx - 180 - 20; 
          tooltip.style("left", left + "px").style("top", (my - 20) + "px");
      })
      .on("mousemove", function(event) {
          const [mx, my] = d3.pointer(event, container.node());
          let left = mx + 20;
          if (left + 180 > width) left = mx - 180 - 20;
          tooltip.style("left", left + "px").style("top", (my - 20) + "px");
      })
      .on("mouseout", function(event, d) {
          const baseColor = selectedCountry && selectedCountry !== d.Country ? d3.color(metric.color).copy({opacity: 0.3}) : metric.color;
          d3.select(this).attr("fill", baseColor);
          tooltip.style("visibility", "hidden");
      })
      .on("click", (e, d) => {
        selectedCountry = selectedCountry === d.Country ? null : d.Country;
        updateChart();
      });

    bars.exit().transition(t)
      .attr("y", height - margin.bottom)
      .attr("height", 0)
      .remove();

    const labels = barsGroup.selectAll(".bar-label")
      .data(countryTotals, d => d.Country);

    const labelsEnter = labels.enter().append("text")
      .attr("class", "bar-label")
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("font-weight", "bold")
      .style("pointer-events", "none")
      .style("fill", "#333")
      .style("opacity", 0);

    labelsEnter.merge(labels)
      .transition(t)
      .attr("x", d => x(d.Country) + x.bandwidth() / 2)
      .attr("y", d => y(d[currentMetric]) - 5)
      .style("opacity", d => selectedCountry && selectedCountry !== d.Country ? 0.3 : 1)
      .text(d => {
        const total = formatTotal(d[currentMetric]);
        const ratio = formatRatio(d[currentMetric], d.production);
        return `${total} (${ratio}/t)`; 
      });

    labels.exit().remove();
  }

  updateChart();
}