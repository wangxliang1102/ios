// intehealth.js
const STANDARDS = {
    bmi: [18.5, 24.9],
    body_fat: { male: [8, 20], female: [21, 33] },
    protein: 1.6
};

document.getElementById('healthForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const inputs = getFormInputs();
    const errors = validateInput(inputs);
    
    if (errors.length > 0) {
        alert(errors.join('\n'));
        return;
    }

    showLoading(true);
    
    setTimeout(() => {
        try {
            const metrics = calculateHealthMetrics(inputs);
            const injuries = Array.from(document.querySelectorAll('input[name="injuries"]:checked')).map(i => i.value);
            const analysis = generateRecommendations(metrics, injuries);
            renderResults(metrics, analysis);
        } catch (error) {
            alert('计算过程中发生错误: ' + error.message);
        } finally {
            showLoading(false);
        }
    }, 500);
});

function getFormInputs() {
    return {
        height: parseFloat(document.getElementById('height').value),
        weight: parseFloat(document.getElementById('weight').value),
        age: parseInt(document.getElementById('age').value),
        gender: document.querySelector('input[name="gender"]:checked').value
    };
}

function validateInput(inputs) {
    const errors = [];
    
    if (isNaN(inputs.height) || inputs.height < 1.0 || inputs.height > 2.5) {
        errors.push('请输入有效身高（1.0-2.5米）');
    }
    if (isNaN(inputs.weight) || inputs.weight < 30 || inputs.weight > 300) {
        errors.push('请输入有效体重（30-300kg）');
    }
    if (isNaN(inputs.age) || inputs.age < 18 || inputs.age > 100) {
        errors.push('请输入有效年龄（18-100岁）');
    }

    return errors;
}

function calculateHealthMetrics(inputs) {
    const height = inputs.height;
    const weight = inputs.weight;
    const gender = inputs.gender === '男' ? 'male' : 'female';
    
    const bmi = weight / (height ** 2);
    const bodyFat = (1.28 * bmi) + (0.23 * inputs.age) - (gender === 'male' ? 10.8 : 5.4);
    const idealWeight = STANDARDS.bmi[1] * (height ** 2);
    
    return {
        bmi: bmi,
        body_fat: bodyFat,
        ideal_weight: idealWeight,
        weight_diff: weight - idealWeight,
        protein_needs: weight * STANDARDS.protein,
        gender: gender
    };
}

function generateRecommendations(metrics, injuries) {
    const recs = [];
    
    // BMI建议
    if (metrics.bmi < STANDARDS.bmi[0]) {
        recs.push("🏋️ 增加抗阻训练（每周3-4次）", "🥛 每日增加300-500大卡热量摄入");
    } else if (metrics.bmi > STANDARDS.bmi[1]) {
        recs.push("🏃 每周进行4次有氧训练", "🥗 控制碳水摄入（每日-300大卡）");
    } else {
        recs.push("💪 保持当前训练计划");
    }

    // 体脂建议
    const fatRange = STANDARDS.body_fat[metrics.gender];
    if (metrics.body_fat > fatRange[1]) {
        recs.push("🔥 增加HIIT训练（每周2-3次）", "🥑 减少饱和脂肪摄入");
    }

    // 伤病建议
    const injuryAdvice = {
        '膝盖损伤': ["避免深蹲", "推荐游泳训练"],
        '腰部损伤': ["避免硬拉", "加强核心训练"]
    };
    injuries.forEach(injury => {
        recs.push(...(injuryAdvice[injury] || []));
    });

    return {
        recommendations: recs,
        diet_plan: {
            protein: metrics.protein_needs,
            calories: metrics.weight_diff > 0 ? 
                metrics.weight_diff * 7.7 + 1800 : 
                2200
        }
    };
}

function renderResults(metrics, analysis) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <div class="result-grid">
            ${renderMetricsTable(metrics)}
            <div id="radarChart" style="height:400px"></div>
        </div>
        ${renderDietPlan(analysis)}
        ${renderTrainingPlan(analysis)}
        ${renderProgressBars(metrics)}
        <div class="button-container">
            <button onclick="location.reload()" style="margin-top:20px;padding:10px 20px">🔄 重新分析</button>
        </div>
    `;
    
    initRadarChart(metrics);
}

function renderMetricsTable(metrics) {
    return `<table class="metrics-table" style="width:100%;border-collapse:collapse;">
        <tr>
            <td>📏 BMI</td>
            <td>${metrics.bmi.toFixed(1)}</td>
            <td>标准 ${STANDARDS.bmi.join('-')}</td>
        </tr>
        <tr>
            <td>📈 体脂率</td>
            <td>${metrics.body_fat.toFixed(1)}%</td>
            <td>标准 ${STANDARDS.body_fat[metrics.gender].join('%-')}%</td>
        </tr>
        <tr>
            <td>🎯 理想体重</td>
            <td>${metrics.ideal_weight.toFixed(1)}kg</td>
            <td>差异 ${metrics.weight_diff > 0 ? '+' : ''}${metrics.weight_diff.toFixed(1)}kg</td>
        </tr>
    </table>`;
}

function renderDietPlan(analysis) {
    return `<div class="collapsible">
        <h3>🍽️ 每日饮食建议</h3>
        <table style="width:100%;margin:10px 0">
            <tr><th style="text-align:left">营养素</th><th style="text-align:left">建议摄入量</th></tr>
            <tr><td>蛋白质</td><td>${analysis.diet_plan.protein.toFixed(1)}g</td></tr>
            <tr><td>总热量</td><td>${analysis.diet_plan.calories.toFixed(0)}大卡</td></tr>
        </table>
        <h4>推荐食物搭配：</h4>
        <ul style="margin-left:20px">
            <li>早餐：燕麦50g + 鸡蛋2个 + 坚果30g</li>
            <li>午餐：糙米饭150g + 鸡胸肉200g + 西兰花200g</li>
            <li>晚餐：三文鱼150g + 杂粮粥200g + 时蔬300g</li>
        </ul>
    </div>`;
}

function renderTrainingPlan(analysis) {
    return `<div class="collapsible">
        <h3>🏅 个性化训练方案</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
            <div>
                <h4>💪 力量训练</h4>
                <ul style="margin-left:20px">
                    ${analysis.recommendations.slice(0,2).map(r => `<li>${r}</li>`).join('')}
                </ul>
            </div>
            <div>
                <h4>🏃 有氧训练</h4>
                <ul style="margin-left:20px">
                    ${analysis.recommendations.slice(2,4).map(r => `<li>${r}</li>`).join('')}
                </ul>
            </div>
        </div>
    </div>`;
}

function renderProgressBars(metrics) {
    return `<div style="margin:20px 0">
        ${createProgressBar('BMI', metrics.bmi, 30)}
        ${createProgressBar('体脂率', metrics.body_fat, 40)}
    </div>`;
}

function createProgressBar(title, current, max) {
    const percent = (current / max) * 100;
    let color = '#4CAF50';
    if (percent > 100 && percent <= 120) color = '#FFC107';
    if (percent > 120) color = '#F44336';

    return `<div class="progress-container">
        <div class="progress-bar" style="width: ${Math.min(percent, 100)}%; background: ${color}">
            ${title}: ${current.toFixed(1)} (${percent.toFixed(1)}%)
        </div>
    </div>`;
}

function initRadarChart(metrics) {
    const chart = echarts.init(document.getElementById('radarChart'));
    const option = {
        radar: {
            indicator: [
                { name: 'BMI', max: 35 },
                { name: '体脂率', max: 40 },
                { name: '蛋白质需求', max: 200 },
                { name: '体重差异', max: Math.abs(metrics.weight_diff) + 10 }
            ],
            shape: 'circle',
            splitArea: {
                areaStyle: {
                    color: ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.4)']
                }
            }
        },
        series: [{
            type: 'radar',
            data: [{
                value: [
                    metrics.bmi,
                    metrics.body_fat,
                    metrics.protein_needs,
                    Math.abs(metrics.weight_diff)
                ],
                name: '健康指标',
                areaStyle: {
                    color: 'rgba(64, 158, 255, 0.6)'
                }
            }]
        }]
    };
    chart.setOption(option);
}

function showLoading(show) {
    document.getElementById('loader').style.display = show ? 'flex' : 'none';
}
