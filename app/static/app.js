// HTML에서 사용할 DOM 요소들을 변수에 저장합니다.
const loanForm = document.getElementById('loan-form');
const submitBtn = document.getElementById('submit-btn');
const btnSpinner = submitBtn.querySelector('.btn-spinner');
const formError = document.getElementById('form-error');

const resultEmpty = document.getElementById('result-empty');
const resultContent = document.getElementById('result-content');
const gaugePercent = document.getElementById('gauge-percent');
const gaugeFill = document.getElementById('gauge-fill');
const decisionBadge = document.getElementById('decision-badge');
const riskGrade = document.getElementById('risk-grade');
const requestId = document.getElementById('request-id');
const timestamp = document.getElementById('timestamp');

// 폼 제출 이벤트 리스너를 등록합니다.
loanForm.addEventListener('submit', async function (event) {
  // 폼 제출 시 기본 동작인 페이지 새로고침을 방지합니다.
  event.preventDefault();

  // 이전 처리 과정에서 표시된 에러 메시지를 초기화합니다.
  formError.textContent = '';

  // 폼 입력 데이터를 FormData 객체로 생성합니다.
  const formData = new FormData(loanForm);

  // API 사양에 맞춰 JSON 형태로 변환할 요청 객체를 구성합니다. (숫자 필드는 Number()로 변환)
  const payload = {
    age: Number(formData.get('age')),
    gender: formData.get('gender'),
    annual_income: Number(formData.get('annual_income')),
    employment_years: Number(formData.get('employment_years')),
    housing_type: formData.get('housing_type'),
    credit_score: Number(formData.get('credit_score')),
    existing_loan_count: Number(formData.get('existing_loan_count')),
    annual_card_usage: Number(formData.get('annual_card_usage')),
    debt_ratio: Number(formData.get('debt_ratio')),
    loan_amount: Number(formData.get('loan_amount')),
    loan_purpose: formData.get('loan_purpose'),
    repayment_method: formData.get('repayment_method'),
    loan_period: Number(formData.get('loan_period'))
  };

  // 중복 요청 방지를 위해 제출 버튼을 비활성화하고 로딩 스피너를 보여줍니다.
  submitBtn.disabled = true;
  btnSpinner.hidden = false;

  try {
    // API 엔드포인트(/predict)로 POST 요청을 보냅니다.
    const response = await fetch('/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    // 응답 JSON 데이터를 파싱합니다.
    const result = await response.json();

    // HTTP 상태 코드가 정상(200~299)이 아닌 경우 에러를 발생시킵니다.
    if (!response.ok) {
      // API 응답 객체에 detail이 있으면 해당 메시지를, 없으면 기본 메시지를 사용합니다.
      throw new Error(result.detail || '예측 요청 처리 중 오류가 발생했습니다.');
    }

    // 성공 시 결과 패널을 표시하도록 화면을 조작합니다.
    resultEmpty.hidden = true;
    resultContent.hidden = false;

    // 승인 확률(0.0 ~ 1.0)을 백분율(%) 형태의 정수로 계산합니다.
    const percentVal = Math.round(result.probability * 100);
    gaugePercent.textContent = `${percentVal}%`;

    // SVG 게이지 원형 바의 채우기(stroke-dashoffset) 비율을 업데이트합니다. (원주 길이 439.8 기준)
    const strokeDashoffset = 439.8 * (1 - result.probability);
    gaugeFill.style.strokeDashoffset = strokeDashoffset;

    // 승인 여부에 따라 배지의 텍스트와 디자인 스타일을 변경합니다.
    if (result.approved) {
      decisionBadge.textContent = '승인 가능';
      decisionBadge.className = 'decision-badge decision-badge--approved';
    } else {
      decisionBadge.textContent = '거절 (승인 불가)';
      decisionBadge.className = 'decision-badge decision-badge--rejected';
    }

    // 리스크 등급 텍스트와 등급별 색상 클래스를 적용합니다.
    riskGrade.textContent = result.risk_grade;
    riskGrade.className = `grade-pill grade-pill--${result.risk_grade}`;

    // 요청 ID와 시간 텍스트를 화면에 표시합니다.
    requestId.textContent = result.request_id;
    timestamp.textContent = result.timestamp;

  } catch (error) {
    // 요청 실패(422, 503 등) 또는 예외 발생 시 화면의 에러 표시 영역에 메시지를 출력합니다.
    formError.textContent = error.message;
  } finally {
    // 성공/실패 여부와 상관없이 버튼을 다시 활성화하고 로딩 스피너를 숨깁니다.
    submitBtn.disabled = false;
    btnSpinner.hidden = true;
  }
});