export interface Lecture {
  id: string;
  title: string;
  code: string;
  highSchoolBridge: string;
  vietnameseExplanation: string;
  formulas: { label: string; formula: string }[];
  workedExample: { problem: string; solution: string };
  bilingualDictionary: { term: string; translation: string; desc: string }[];
}

export const LECTURES_DATA: Lecture[] = [
  {
    id: "lecture-1",
    title: "Bài 1: Giới hạn, Sự liên tục & Kỹ thuật Epsilon-Delta (ε-δ)",
    code: "Lecture 1 (Kim)",
    highSchoolBridge: "Ở cấp 3, chúng ta học giới hạn theo trực giác: 'khi x tiến gần c thì f(x) tiến gần L'. Các bài tập giới hạn chủ yếu là tính toán biến đổi đại số để triệt tiêu các mẫu số bằng 0. Nhưng lên đại học (KAIST), toán học yêu cầu sự chặt chẽ tối đa. Kỹ thuật ε-δ giúp định nghĩa chính xác giới hạn là gì thông qua bài toán kiểm soát sai số (Quality Control).",
    vietnameseExplanation: "Hãy tưởng tượng bạn là quản lý nhà máy sản xuất. Để sản phẩm đầu ra (output f(x)) đạt chuẩn với sai số cho phép nhỏ hơn ε (tức là |f(x) - L| < ε), bạn phải khống chế nguyên liệu đầu vào (input x) trong một khoảng sai số δ tương xứng quanh thông số tiêu chuẩn c (tức là 0 < |x - c| < δ). Nếu với MỌI mức sai số ε > 0 mà khách hàng yêu cầu, bạn LUÔN tìm được một khoảng kiểm soát δ > 0 tương ứng phù hợp, thì ta nói giới hạn của f(x) khi x tiến tới c là L.",
    formulas: [
      {
        label: "Định nghĩa Giới hạn bằng ε-δ (Rigorous Limit)",
        formula: "\\lim_{x \\to c} f(x) = L \\iff \\forall \\epsilon > 0, \\exists \\delta > 0 \\text{ s.t. } 0 < |x - c| < \\delta \\implies |f(x) - L| < \\epsilon"
      },
      {
        label: "Giới hạn một phía (One-sided Limits)",
        formula: "\\lim_{x \\to c} f(x) = L \\iff \\lim_{x \\to c^+} f(x) = \\lim_{x \\to c^-} f(x) = L"
      },
      {
        label: "Tính liên tục tại một điểm (Continuity at c)",
        formula: "\\lim_{x \\to c^+} f(x) = \\lim_{x \\to c^-} f(x) = f(c)"
      }
    ],
    workedExample: {
      problem: "Chứng minh bằng định nghĩa ε-δ rằng $\\lim_{x \\to 2} (2x + 1) = 5$.",
      solution: "Phân tích nháp trước: Ta muốn $|(2x + 1) - 5| < \\epsilon$ bất cứ khi nào $0 < |x - 2| < \\delta$.\n\nBiến đổi: $|2x - 4| < \\epsilon \\iff 2|x - 2| < \\epsilon \\iff |x - 2| < \\frac{\\epsilon}{2}$.\n\nCách trình bày lời giải đại học:\nVới mọi $\\epsilon > 0$ cho trước, chọn $\\delta = \\frac{\\epsilon}{2}$.\nKhi đó, với mọi $x$ thỏa mãn $0 < |x - 2| < \\delta$, ta có:\n$$| (2x + 1) - 5 | = |2x - 4| = 2|x - 2| < 2\\delta = 2\\left(\\frac{\\epsilon}{2}\\right) = \\epsilon.$$\nVậy theo định nghĩa, giới hạn đã được chứng minh."
    },
    bilingualDictionary: [
      { term: "Limit", translation: "Giới hạn", desc: "Giá trị mà hàm số tiến tới gần khi biến số tiến tới một điểm." },
      { term: "Continuity", translation: "Sự liên tục", desc: "Hàm số không bị đứt gãy tại điểm c, tức là giới hạn bằng giá trị của hàm." },
      { term: "Quality Control", translation: "Kiểm soát chất lượng", desc: "Góc nhìn kỹ thuật giải thích tại sao ε quyết định δ." },
      { term: "Heaviside function", translation: "Hàm bước Heaviside", desc: "Hàm nhảy vọt bằng 0 khi x < 0 và bằng 1 khi x >= 0, không liên tục tại x = 0." }
    ]
  },
  {
    id: "lecture-2",
    title: "Bài 2: Đạo hàm, Tốc độ tăng trưởng & Tuyến tính hóa (Linearization)",
    code: "Lecture 2 & 3",
    highSchoolBridge: "Bạn đã quen thuộc với khái niệm đạo hàm là hệ số góc của tiếp tuyến. Ở bậc đại học, chúng ta nhấn mạnh ý nghĩa vật lý và mô hình hóa: Đạo hàm chính là tỷ lệ tăng trưởng tức thời (instantaneous growth rate). Hơn thế nữa, chúng ta sử dụng xấp xỉ tuyến tính (Linearization) và vi phân (differential dy) để quy đổi các phương trình phi tuyến phức tạp thành đường thẳng đơn giản tại lân cận điểm xét.",
    vietnameseExplanation: "Khi phóng to đồ thị hàm số phi tuyến f(x) tại lân cận của điểm tiếp xúc (c, f(c)), đồ thị của hàm số và đường tiếp tuyến trông ngày càng giống hệt nhau. Tiếp tuyến chính là xấp xỉ tuyến tính tốt nhất của f(x) tại điểm đó. Công thức xấp xỉ tuyến tính L(x) cho phép ta tính nhanh giá trị của hàm số phức tạp (như căn bậc 3, hàm số mũ) mà không cần máy tính bọc túi.",
    formulas: [
      {
        label: "Tốc độ tăng trưởng trung bình (Mean Growth Rate)",
        formula: "\\text{Mean Growth Rate} = \\frac{f(b) - f(a)}{b - a} = \\frac{f(c+h) - f(c)}{h}"
      },
      {
        label: "Đạo hàm tại điểm c (Derivative/Instantaneous Growth Rate)",
        formula: "f'(c) = \\lim_{h \\to 0} \\frac{f(c+h) - f(c)}{h}"
      },
      {
        label: "Tuyến tính hóa (Linearization)",
        formula: "L(x) = f(c) + f'(c)(x - c)"
      },
      {
        label: "Vi phân (Differentials)",
        formula: "dy = f'(c)dx"
      }
    ],
    workedExample: {
      problem: "Tìm tuyến tính hóa $L(x)$ của hàm số $f(x) = \\sqrt{1 + x}$ tại $x = 0$ và xấp xỉ giá trị của $\\sqrt{1.05}$.",
      solution: "Bước 1: Tính đạo hàm:\n$f'(x) = \\frac{1}{2}(1 + x)^{-1/2} = \\frac{1}{2\\sqrt{1+x}}$.\n\nBước 2: Thế điểm $c = 0$:\n$f(0) = 1$ và $f'(0) = \\frac{1}{2} = 0.5$.\n\nBước 3: Lập phương trình tuyến tính hóa:\n$L(x) = f(0) + f'(0)(x - 0) = 1 + 0.5x$.\n\nBước 4: Xấp xỉ $\\sqrt{1.05}$:\nĐể tính $\\sqrt{1.05}$, ta lấy $x = 0.05$.\n$f(0.05) \\approx L(0.05) = 1 + 0.5(0.05) = 1.025$.\n(Giá trị thực tế bấm máy là $1.02469$, sai số cực nhỏ $0.0003$!)"
    },
    bilingualDictionary: [
      { term: "Mean Growth Rate", translation: "Tốc độ tăng trưởng trung bình", desc: "Tỉ số biến thiên hàm số chia biến thiên biến số (hệ số góc cát tuyến)." },
      { term: "Instantaneous Growth Rate", translation: "Tốc độ tăng trưởng tức thời", desc: "Giới hạn tốc độ trung bình khi h tiến tới 0 (hệ số góc tiếp tuyến)." },
      { term: "Linearization", translation: "Tuyến tính hóa / Xấp xỉ bậc nhất", desc: "Thay thế đường cong bằng tiếp tuyến tại vùng lân cận hẹp." },
      { term: "Differential", translation: "Vi phân", desc: "Biểu lượng lượng biến đổi dọc theo tiếp tuyến: dy = f'(c) dx." }
    ]
  },
  {
    id: "lecture-3",
    title: "Bài 3: Các Kỹ thuật Tích phân Nâng cao (Substitution, Parts & Trig Substitution)",
    code: "Lecture 5 & 6 (Arts)",
    highSchoolBridge: "Nếu như đạo hàm là hoạt động tháo phân rã dựa trên công thức mẫu mực, thì tích phân là hoạt động thiết kế nghệ thuật đảo ngược (reversing). Ngoài pp đổi biến số u-substitution cơ bản và tích phân từng phần (integration by parts), lên đại học chúng ta học cách xử lý các phân thức hữu tỉ bằng phân tích phân số một phần (partial fractions) và các biểu thức chứa căn vô tỉ bằng phương pháp Đổi biến Lượng giác (Trigonometric Substitution).",
    vietnameseExplanation: "Khi gặp biểu thức chứa căn bậc hai dạng hình học Pythagore như $\\sqrt{a^2-x^2}$, $\\sqrt{a^2+x^2}$, hoặc $\\sqrt{x^2-a^2}$, ta có thể triệt tiêu căn thức bằng cách vẽ một tam giác vuông mô phỏng lượng giác. Bằng cách đặt $x = a\\sin\\theta$, ta chuyển đổi $\\sqrt{a^2-x^2}$ thành $a\\cos\\theta$ nhờ đồng nhất thức $\\sin^2\\theta + \\cos^2\\theta = 1$. Việc này định nghĩa lại biến tích phân từ đường thẳng sang cung tròn góc quay.",
    formulas: [
      {
        label: "Đổi biến số (Substitution Method)",
        formula: "\\int f(g(x))g'(x)\\,dx = \\int f(u)\\,du \\quad (\\text{với } u = g(x))"
      },
      {
        label: "Tích phân từng phần (Integration by Parts)",
        formula: "\\int u'v\\,dx = uv - \\int uv'\\,dx \\quad \\text{hoặc} \\quad \\int v\\,du = uv - \\int u\\,dv"
      },
      {
        label: "Công thức hạ bậc tuần hoàn (Reduction Formula for Sine)",
        formula: "\\int \\sin^n(x)\\,dx = -\\frac{1}{n}\\sin^{n-1}(x)\\cos(x) + \\frac{n-1}{n}\\int \\sin^{n-2}(x)\\,dx"
      },
      {
        label: "Đổi biến lượng giác loại 1 (\\sqrt{a^2 - x^2})",
        formula: "x = a\\sin\\theta \\implies dx = a\\cos\\theta\\,d\\theta \\quad \\text{và} \\quad \\sqrt{a^2-x^2} = a\\cos\\theta"
      },
      {
        label: "Đổi biến lượng giác loại 2 (\\sqrt{a^2 + x^2})",
        formula: "x = a\\tan\\theta \\implies dx = a\\sec^2\\theta\\,d\\theta \\quad \\text{và} \\quad \\sqrt{a^2+x^2} = a\\sec\\theta"
      }
    ],
    workedExample: {
      problem: "Tính tích phân $\\int \\frac{1}{\\sqrt{4 + x^2}}\\,dx$ bằng phương pháp đổi biến lượng giác.",
      solution: "Bước 1: Nhận diện căn dạng $\\sqrt{a^2 + x^2}$ với $a = 2$. Đặt $x = 2\\tan\\theta$.\nKhi đó, $dx = 2\\sec^2\\theta\\,d\\theta$.\nCăn thức biến đổi: $\\sqrt{4 + x^2} = \\sqrt{4 + 4\\tan^2\\theta} = 2\\sec\\theta$.\n\nBước 2: Thay thế vào tích phân ban đầu:\n$$\\int \\frac{1}{2\\sec\\theta} \\cdot 2\\sec^2\\theta\\,d\\theta = \\int \\sec\\theta\\,d\\theta$$\n\nBước 3: Tra cứu tích phân chuẩn của sec(x):\n$$\\int \\sec\\theta\\,d\\theta = \\ln|\\sec\\theta + \\tan\\theta| + C$$\n\nBước 4: Trả lại biến x:\nTa có $\\tan\\theta = \\frac{x}{2}$ và $\\sec\\theta = \\frac{\\sqrt{4+x^2}}{2}$. Do đó:\n$$\\ln\\left|\\frac{\\sqrt{4+x^2}}{2} + \\frac{x}{2}\\right| + C = \\ln\\left|\\sqrt{4+x^2} + x\\right| + C'$$"
    },
    bilingualDictionary: [
      { term: "Antiderivative", translation: "Nguyên hàm", desc: "Hàm ngược của phép lấy đạo hàm." },
      { term: "Integration by parts", translation: "Tích phân từng phần", desc: "Phương pháp đảo ngược quy tắc đạo hàm tích hai hàm số (Product Rule)." },
      { term: "Trigonometric Substitution", translation: "Đổi biến lượng giác", desc: "Phương pháp đặt x theo hàm lượng giác để giải phương trình vi phân/tích phân chứa căn Pythagore." },
      { term: "Partial Fractions", translation: "Phân tách phân số tuần phần", desc: "Tách một phân thức hữu tỉ có mẫu bậc cao thành tổng các phân thức đơn giản có mẫu bậc 1 hoặc bậc 2 vô nghiệm." }
    ]
  },
  {
    id: "lecture-4",
    title: "Bài 4: Hệ tọa độ & Quỹ đạo hạt TNB (Frenet-Serret Frame & Curves)",
    code: "Lecture 1 (Arts & Motion)",
    highSchoolBridge: "Trong chương trình phổ thông, chúng ta học về chuyển động thẳng đều, chuyển động tròn trên mặt phẳng 2D. Trong giáo trình đại học, chuyển động được mô tả bởi một phương trình vector 3D tự do $\\mathbf{r}(t) = x(t)\\mathbf{i} + y(t)\\mathbf{j} + z(t)\\mathbf{k}$. Để nắm bắt cấu trúc hình học của đường cong 3D mà không phụ thuộc vào thời gian, ta sử dụng tham số độ dài cung (arclength s) và Hệ tọa độ TNB động.",
    vietnameseExplanation: "Hệ Frenet-Serret (TNB) là một hệ cơ sở tọa độ động di chuyển dọc theo quỹ đạo thiết kế của hạt. Tại mỗi thời điểm: T (Unit Tangent) là vector định hướng vận tốc; N (Principal Normal) là vector hướng vuông góc chỉ phương lệch rẽ của hạt; còn B (Binormal) là tích có hướng của T và N xác định mặt phẳng chứa đường cong (Mặt phẳng mật tiếp). Hai thông số mấu chốt quyết định hình dáng đường cong 3D là Độ cong (Curvature κ - đo độ bẻ lái) và Độ xoắn (Torsion τ - đo mức độ uốn vặn thoát ly khỏi mặt phẳng phẳng ban đầu).",
    formulas: [
      {
        label: "Vector Vận Tốc & Tốc độ s' (Velocity & Speed)",
        formula: "\\mathbf{v}(t) = \\dot{\\mathbf{r}}(t), \\quad v(t) = \\|\\mathbf{v}(t)\\| = \\frac{ds}{dt}"
      },
      {
        label: "Hệ Tọa độ TNB (Frenet-Serret Frame)",
        formula: "\\mathbf{T} = \\frac{\\mathbf{v}}{\\|\\mathbf{v}\\|}, \\quad \\mathbf{N} = \\frac{\\dot{\\mathbf{T}}}{\\|\\dot{\\mathbf{T}}\\|}, \\quad \\mathbf{B} = \\mathbf{T} \\times \\mathbf{N}"
      },
      {
        label: "Độ Cong (Curvature κ)",
        formula: "\\kappa = \\left\\| \\frac{d\\mathbf{T}}{ds} \\right\\| = \\frac{\\|\\mathbf{v} \\times \\mathbf{a}\\|}{\\|\\mathbf{v}\\|^3}"
      },
      {
        label: "Độ Xoắn (Torsion τ)",
        formula: "\\tau = \\frac{\\det(\\dot{\\mathbf{r}}, \\ddot{\\mathbf{r}}, \\dddot{\\mathbf{r}})}{\\|\\mathbf{v} \\times \\mathbf{a}\\|^2}"
      },
      {
        label: "Phân tích Vector Gia Tốc (Acceleration Components)",
        formula: "\\mathbf{a} = C_T \\mathbf{T} + C_N \\mathbf{N} = \\left(\\frac{d v}{dt}\\right)\\mathbf{T} + (\\kappa v^2)\\mathbf{N}"
      }
    ],
    workedExample: {
      problem: "Cho vòng xoắn lò xo 3D (Helix) $\\mathbf{r}(t) = \\cos(t)\\mathbf{i} + \\sin(t)\\mathbf{j} + t\\mathbf{k}$. Tính độ dài cung từ $t=0$ đến $t=2\\pi$ và tìm độ cong $\\kappa$.",
      solution: "Bước 1: Tính vector vận tốc:\n$$\\mathbf{v}(t) = -\\sin(t)\\mathbf{i} + \\cos(t)\\mathbf{j} + \\mathbf{k}$$\n\nBước 2: Tính tốc độ (độ lớn vận tốc):\n$$v(t) = \\sqrt{(-\\sin(t))^2 + \\cos^2(t) + 1^2} = \\sqrt{1 + 1} = \\sqrt{2}$$\n\nBước 3: Tính độ dài cung s:\n$$s = \\int_0^{2\\pi} \\|\\mathbf{v}(t)\\|\\,dt = \\int_0^{2\\pi} \\sqrt{2}\\,dt = 2\\sqrt{2}\\pi$$\n\nBước 4: Tính độ cong $\\kappa$:\nGia tốc $\\mathbf{a}(t) = -\\cos(t)\\mathbf{i} - \\sin(t)\\mathbf{j} + 0\\mathbf{k}$.\nTích chéo $\\mathbf{v} \\times \\mathbf{a} = \\sin(t)\\mathbf{i} - \\cos(t)\\mathbf{j} + \\mathbf{k}$.\n$$\\|\\mathbf{v} \\times \\mathbf{a}\\| = \\sqrt{\\sin^2(t) + \\cos^2(t) + 1} = \\sqrt{2}$$\n$$\\kappa = \\frac{\\|\\mathbf{v} \\times \\mathbf{a}\\|}{\\|\\mathbf{v}\\|^3} = \\frac{\\sqrt{2}}{(\\sqrt{2})^3} = \\frac{1}{2}$$\nĐộ cong của Helix tuần hoàn là một hằng số bằng 1/2!"
    },
    bilingualDictionary: [
      { term: "Arclength", translation: "Độ dài cung", desc: "Tổng quãng đường đi được dọc theo đường cong tích lũy theo thời gian." },
      { term: "Curvature", translation: "Độ cong (κ)", desc: "Mức độ bẻ hướng của tiếp tuyến tại một điểm, đường thẳng có độ cong bằng 0, đường tròn bán kính R có độ cong 1/R." },
      { term: "Torsion", translation: "Độ xoắn (τ)", desc: "Mức độ vặn lệch khỏi phẳng phẳng của đường cong 3D." },
      { term: "Osculating circle", translation: "Đường tròn mật tiếp", desc: "Đường tròn tiếp xúc khít tối đa với đường cong tại lân cận lồi lôm có bán kính R = 1/κ." }
    ]
  },
  {
    id: "lecture-5",
    title: "Bài 5: Cơ học Vũ Trụ, Lực Hấp Dẫn & Định Luật Kepler",
    code: "Lecture 6 & 7 (Kepler)",
    highSchoolBridge: "Vật lý trung học đơn giản hóa chuyển động ném vật gần mặt đất với gia tốc trọng trường g không đổi, quỹ đạo parabol. Lên đại học toán-lý chuyên sâu, ta chứng minh chuyển động thiên thể trong không gian vũ trụ tuân theo Luật Hấp Dẫn Coulomb-Pythagore của Newton ($F \\propto 1/r^2$). Quỹ đạo hành tinh thu được giải bằng phương pháp giải tích phân và chính là một đường Elip có Mặt trời đặt tại một tiêu điểm.",
    vietnameseExplanation: "Bài toán hai vật (Two-Body Problem) được đơn giản hóa bằng cách chuyển về hệ quy chiếu Khối Tâm (Barycenter Frame) làm gốc tọa độ. Khi đó, phương trình quỹ đạo tương đối r thiết lập bằng vi phân bậc hai: $\\ddot{\\mathbf{r}} = -\\frac{k}{r^2}\\mathbf{e}_r$. Bằng cách đổi biến thông minh $u = 1/r$ theo góc lượng giác $\\theta$ (chứ không theo thời gian t), phương trình vi phân bậc hai phức tạp chuyển hóa thành phương trình dao động điều hòa đơn giản $u'' + u = K$. Nghiệm của phương trình này đại diện trực tiếp cho một đường elip có tiêu điểm trùng với gốc tọa độ.",
    formulas: [
      {
        label: "Gia tốc quỹ đạo trọng trường (Gravity Attraction)",
        formula: "\\ddot{\\mathbf{r}} = -\\frac{k}{r^2}\\mathbf{e}_r \\quad \\text{với } k = G(m_1 + m_2)"
      },
      {
        label: "Phương trình vi phân quỹ đạo (Orbital Differential Equation)",
        formula: "\\frac{d^2u}{d\\theta^2} + u = K \\quad \\text{với } u = \\frac{1}{r}, K = \\frac{G(m_1 + m_2)}{L^2}"
      },
      {
        label: "Hàm nghiệm khoảng cách Elip (Elliptical Orbit)",
        formula: "r(\\theta) = \\frac{1/K}{1 + e\\cos(\\theta - \\theta_0)} = \\frac{L^2}{(1 + e\\cos(\\theta - \\theta_0))G(m_1 + m_2)}"
      },
      {
        label: "Độ lệch tâm quỹ đạo (Eccentricity e)",
        formula: "e = \\frac{\\sqrt{A^2 + B^2}}{K} \\quad (0 \\le e < 1: \\text{Elip}, e=0: \\text{Tròn}, e \\ge 1: \\text{Parabol/Hyperbol})"
      }
    ],
    workedExample: {
      problem: "Sử dụng tính bảo toàn mô-men động lượng $L = r^2\\dot{\\theta}$, hãy chứng minh rằng vận tốc quét diện tích (areal velocity) $\\dot{A}(t)$ là một hằng số (Định luật Kepler thứ hai).",
      solution: "Bước 1: Diện tích quét bởi vector vị trí phát sinh trong khoảng thời gian cực ngắn dt xấp xỉ diện tích tam giác con:\n$$dA = \\frac{1}{2} r^2 d\\theta$$\n\nBước 2: Đạo hàm diện tích quét theo thời gian t:\n$$\\dot{A}(t) = \\frac{dA}{dt} = \\frac{1}{2} r^2 \\frac{d\\theta}{dt} = \\frac{1}{2} r^2 \\dot{\\theta}$$\n\nBước 3: Vì lực hút hấp dẫn hướng tâm song song tuyệt đối với vector r, nên tích chéo $\\mathbf{r} \\times \\mathbf{f} = \\mathbf{0}$.\nMô-men động lượng tương ứng $L = r^2\\dot{\\theta}$ bảo toàn không đổi theo thời gian.\n$$\\dot{A}(t) = \\frac{1}{2} L = \\text{const}$$\nVậy tốc độ quét diện tích của bán kính hành tinh là hằng số bảo toàn, chứng minh Định luật hai Kepler."
    },
    bilingualDictionary: [
      { term: "Two-body problem", translation: "Bài toán hai vật", desc: "Mô hình cơ học mô tả chuyển động của hai điểm khối lượng chỉ chịu lực tương tác hấp dẫn lẫn nhau." },
      { term: "Barycenter", translation: "Barycenter / Khối tâm hệ vật", desc: "Điểm cân bằng khối lượng của hệ thống thiên thể, Mặt Trời thực chất cũng quay quanh khối tâm chung chứ không đứng im hoàn toàn." },
      { term: "Eccentricity", translation: "Độ lệch tâm (e)", desc: "Số đo mô tả mức độ dẹt của quỹ đạo elip, e cận 0 quỹ đạo càng gần tròn." },
      { term: "Directrix", translation: "Đường chuẩn", desc: "Đường thẳng chuẩn định nghĩa đặc trưng hình học elip tỉ lệ khoảng cách." }
    ]
  }
];
