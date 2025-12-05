// Main script that loads data and initializes all visualizations
Promise.all([
    d3.json("data/countries-110m.json"),
    d3.csv("data/dataset.csv")            
]).then(([world, rawData]) => {
    
    const data = rawData.map(d => ({
        ...d,
        Carbon_Emissions_tCO2e: +d.Carbon_Emissions_tCO2e,
        Water_Usage_Liters: +(d.Water_Usage_Million_Litres * 1000000) || +d.Water_Usage_Liters || 0,
        Water_Usage_Million_Litres: +d.Water_Usage_Million_Litres || 0,
        Waste_Production_kg: +(d.Landfill_Waste_Tonnes * 1000) || +d.Waste_Production_kg || 0,
        Landfill_Waste_Tonnes: +d.Landfill_Waste_Tonnes || 0,
        Production_Volume_units: +(d.Monthly_Production_Tonnes * 1000) || +d.Production_Volume_units || 0,
        Monthly_Production_Tonnes: +d.Monthly_Production_Tonnes || 0,
        Sustainability_Rating: +d.Sustainability_Score || +d.Sustainability_Rating || 0,
        Sustainability_Score: +d.Sustainability_Score || 0,
        Ethical_Rating: +d.Ethical_Rating || 0,
        Year: +d.Year || 0,
        Brand: d.Brand || d.Brand_Name || "",
        Brand_Name: d.Brand || d.Brand_Name || "",
        Country: d.Country || ""
    }));

    console.log("Data loaded successfully:", data.length, "records");

    if (typeof initQ7 === 'function') {
        initQ7(data, world);
        console.log("Q7 (Choropleth) initialized");
    }

    if (typeof initQ5 === 'function') {
        initQ5(data);
        console.log("Q5 (Regional Bar Chart) initialized");
    }

    console.log("Checking Q1...", typeof initQ1);
    if (typeof initQ1 === 'function') {
        try {
            initQ1(data);
            console.log("Q1 (Brand Rankings) initialized");
        } catch (error) {
            console.error("Q1 initialization error:", error);
        }
    } else {
        console.error("initQ1 function not found!");
    }

    if (typeof initQ3 === 'function') {
        initQ3(data);
        console.log("Q3 (Time Trends) initialized");
    }

     if (typeof initQ8 === 'function') {
        initQ8(data);
        console.log("Q8 initialized");
    }

    if (typeof initQ2 === 'function') {
        initQ2(data);
        console.log("Q2 initialized");
    }

    if (typeof initQ6 === 'function') {
        initQ6(data);
        console.log("Q6 initialized");
    }

    if (typeof initQ4 === 'function') {
        initQ4(data);
        console.log("Q4 initialized");
    }

    if (typeof initQ9 === 'function') {
        initQ9(data);
        console.log("Q9 initialized");
    }
}).catch(error => {
    console.error("Error loading data:", error);
    
    d3.select("#q7-chart")
        .append("p")
        .style("color", "red")
        .style("padding", "20px")
        .text(`Error loading data: ${error.message}`);
    
    d3.select("#q5-chart")
        .append("p")
        .style("color", "red")
        .style("padding", "20px")
        .text(`Error loading data: ${error.message}`);
});