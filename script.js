// script.js（含PDF导出）

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById("evalBtn").addEventListener("click", evaluate);
  document.getElementById("parqBtn").addEventListener("click", () => {
    document.getElementById("parqModal").classList.remove("hidden");
  });
  document.getElementById("exportPdfBtn")?.addEventListener("click", exportPDF);
});

function exportPDF() {
  const chartContainer = document.getElementById("chart");
  if (chartInstance) {
    // 将图表转为 Base64 图像
    const base64 = chartInstance.getDataURL({ type: 'jpeg', pixelRatio: 2 });
    // 替换图表为图片
    chartContainer.innerHTML = `<img src="${base64}" style="width:100%; height:auto;" />`;
  }

  const reportEl = document.getElementById("report");
  const opt = {
    margin:       0.5,
    filename:     `健康评估报告_${new Date().toLocaleDateString()}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(reportEl).save();
}

// 其余代码保持不变（略）

function closeParq() {
  document.getElementById("parqModal").classList.add("hidden");
}

function submitParq() {
  let score = 0;
  for (let i = 1; i <= 7; i++) {
    const val = document.querySelector(`input[name=q${i}]:checked`);
    if (!val) {
      alert(`请回答第 ${i} 题`);
      return;
    }
    if (val.value === "是") score++;
  }
  closeParq();
  window.parqRiskLevel = score >= 3 ? '高风险' : score >= 1 ? '中风险' : '低风险';
  alert("问卷提交成功，您的风险等级为：" + window.parqRiskLevel);
}

function evaluate() {
  const height = parseFloat(document.getElementById("height").value);
  const weight = parseFloat(document.getElementById("weight").value);
  const waist = parseFloat(document.getElementById("waist")?.value);
  const hip = parseFloat(document.getElementById("hip")?.value);
  const age = parseInt(document.getElementById("age").value);
  const injury = document.getElementById("injury").value;
  const demand = document.getElementById("demand").value;

  if (!height || !weight || !age) {
    alert("请填写完整信息");
    return;
  }

  const stdWeight = (height - 100) * 0.9;
  const diff = weight - stdWeight;
  const bmi = (weight / ((height / 100) ** 2)).toFixed(1);

  let bmiScore = 0;
  if (bmi < 18.5) bmiScore = 60;
  else if (bmi < 24.9) bmiScore = 90;
  else if (bmi < 29.9) bmiScore = 70;
  else bmiScore = 50;

  let whr = null, whrScore = 80;
  if (waist && hip) {
    whr = (waist / hip).toFixed(2);
    if (whr < 0.8) whrScore = 95;
    else if (whr < 0.9) whrScore = 85;
    else if (whr < 1.0) whrScore = 70;
    else whrScore = 55;
  }

  let parqScore = window.parqRiskLevel === '高风险' ? 40 : window.parqRiskLevel === '中风险' ? 70 : 90;
  if (!window.parqRiskLevel) parqScore = 80;

  const healthScore = Math.round((bmiScore + parqScore + whrScore) / 3);
  document.getElementById("score").innerText = healthScore;

  const report = document.getElementById("report");
  report.innerHTML = `
    <section class="bg-white p-6 rounded-xl shadow border border-gray-300 space-y-3">
      <h2 class="text-xl font-bold text-gray-800">📈 BMI 与体重对比图</h2>
      <div id="chart" class="h-64"></div>
    </section>

    <section class="bg-white p-6 rounded-xl shadow border border-gray-300 space-y-3">
      <h2 class="text-xl font-bold text-gray-800">🧠 身体状态分析</h2>
      ${generateBodyStatus(bmi, whr, stdWeight, weight)}
    </section>

    <section class="bg-white p-6 rounded-xl shadow border border-gray-300 space-y-3">
      <h2 class="text-xl font-bold text-gray-800">🥗 饮食建议</h2>
      <p class="text-gray-800 text-base">${generateDietSuggestion(bmi)}</p>
    </section>

    <section class="bg-white p-6 rounded-xl shadow border border-gray-300 space-y-3">
      <h2 class="text-xl font-bold text-gray-800">🏋️ 健身建议（目标：${demand}）</h2>
      <p class="text-gray-800 text-base">${generatePlanByDemand(demand)}</p>
    </section>

    <section class="bg-white p-6 rounded-xl shadow border border-gray-300 space-y-3">
      <h2 class="text-xl font-bold text-gray-800">⚠️ 风险评估等级</h2>
      <p class="text-gray-800 text-base">${window.parqRiskLevel || "未填写问卷，默认中等风险。"}</p>
    </section>
  `;

  drawChart(stdWeight, weight);
}

function generateBodyStatus(bmi, whr, stdWeight, actualWeight) {
  let result = `<p class="text-gray-800">BMI：<span class="text-yellow-500 font-semibold">${bmi}</span>，标准体重：<span class="text-blue-500">${stdWeight.toFixed(1)} kg</span>，当前体重：<span class="text-red-500">${actualWeight} kg</span>。</p>`;
  if (whr) result += `<p class="text-gray-800">腰臀比：<span class="text-purple-600 font-semibold">${whr}</span></p>`;

  if (bmi < 18.5) {
    result += `<p class="text-gray-800">您的体重偏轻，可能存在营养摄入不足或肌肉量不足的情况。建议：增加优质碳水化合物和蛋白质摄入，适当进行阻力训练以提升肌肉质量，关注免疫力和骨密度风险。</p>`;
  } else if (bmi < 24.9) {
    result += `<p class="text-gray-800">体重在正常范围，说明您当前能量摄入与消耗基本平衡。建议继续保持良好的生活方式，维持规律作息和稳定运动，预防体脂缓慢积累。</p>`;
  } else if (bmi < 29.9) {
    result += `<p class="text-gray-800">属于超重范围，虽然未达肥胖标准，但可能存在脂肪堆积尤其是腹部脂肪上升的风险。建议适当调整饮食结构，减少夜宵和高糖摄入，并结合每周3-4次有氧锻炼。</p>`;
  } else {
    result += `<p class="text-gray-800">您的 BMI 已进入肥胖区间，长期维持此状态将显著提高高血压、糖尿病、脂肪肝等慢性病的风险。建议进行系统性的减重计划，结合营养师和健身教练指导效果更佳。</p>`;
  }

  if (whr) {
    if (whr < 0.8) {
      result += `<p class="text-gray-800">您的腰臀比偏低，说明内脏脂肪比例低、肌肉质量较高，属于较健康体型。建议保持当前习惯，关注核心力量训练与姿势均衡。</p>`;
    } else if (whr < 0.9) {
      result += `<p class="text-gray-800">腰臀比在可接受范围，尚未表现出明显代谢风险，但应关注腰围变化，避免久坐、饮食油腻等因素导致腰围升高。</p>`;
    } else if (whr < 1.0) {
      result += `<p class="text-gray-800">腰臀比略偏高，提示内脏脂肪积聚增多，可能存在潜在代谢风险，如胰岛素抵抗、脂肪肝。建议通过饮食调控与高频有氧运动降低腰围。</p>`;
    } else {
      result += `<p class="text-gray-800">腰臀比显著偏高，可能存在腹型肥胖。此类肥胖与心脑血管疾病风险密切相关。建议立即控制饮食并建立至少3个月的减脂计划。</p>`;
    }
  }
  return result;
}

let chartInstance = null;

function drawChart(std, real) {
  chartInstance = echarts.init(document.getElementById("chart"));
  const option = {
    backgroundColor: '#ffffff',
    title: {
      text: '体重对比',
      left: 'center',
      textStyle: {
        color: '#333',
        fontSize: 16
      }
    },
    xAxis: {
      type: 'category',
      data: ['标准体重', '当前体重'],
      axisLabel: { color: '#333' }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#333' }
    },
    series: [{
      type: 'bar',
      data: [std, real],
      itemStyle: {
        color: (params) => params.dataIndex === 0 ? '#60a5fa' : '#f87171'
      }
    }]
  };
  chartInstance.setOption(option);
}

function generateDietSuggestion(bmi) {
  if (bmi < 18.5) return "每日补充1.5~2倍体重克数的蛋白质（如鸡蛋、牛奶、鱼肉），增加高热量主食如糙米、燕麦，规律三餐避免空腹锻炼。";
  if (bmi < 24.9) return "均衡饮食结构为主，保持碳水50%、蛋白30%、脂肪20%比例，规律三餐可配合间歇性断食巩固代谢。";
  if (bmi < 29.9) return "主食中替换部分白米为糙米/红薯，每日控制总热量略低于TDEE；增加膳食纤维摄入、戒掉饮料及高油餐。";
  return "建议采用地中海饮食或控糖饮食结构，减少碳水和高饱和脂肪食物摄入，重点管理每日油盐糖量，必要时记录饮食日志。";
}

function generatePlanByDemand(demand) {
  const plans = {
    "增肌": `目标为提升肌肉质量和力量。推荐每周进行 4-6 次抗阻训练，分部位安排（胸、背、腿、肩、核心），每次训练含多关节动作（如卧推、深蹲、硬拉）。训练后30分钟内摄入优质蛋白（如乳清蛋白+香蕉），并保持每日总热量盈余。`,
    "减脂": `核心在于热量赤字与有氧结合。建议每周进行 3-5 次有氧运动（快走30~45分钟、HIIT、跳绳），同时配合抗阻训练以保留肌肉量。饮食上控制精制糖、炸物与夜宵摄入，规律记录体重变化。`,
    "塑型": `需兼顾肌肉线条与低脂体型。建议每周 3次力量训练 + 2次有氧结合，辅以1次核心与拉伸专项（如普拉提、瑜伽）。饮食结构建议采取高蛋白+中碳水+低脂，保证睡眠充足以利于修复与代谢。`,
    "健康": `目的为改善整体代谢功能和体态习惯。可安排每周3次30分钟快走或游泳，结合居家拉伸、徒手力量训练（深蹲、俯卧撑）。饮食方面多摄入蔬菜水果、优质油脂（橄榄油、坚果），避免暴饮暴食与熬夜。`
  };
  return plans[demand] || "选择运动目标后将自动显示专属方案。";
}