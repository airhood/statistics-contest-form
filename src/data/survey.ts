import type { Survey } from "../lib/types";

export const SURVEY: Survey = {
    "subtitle":  "사람들은 AI가 만든 콘텐츠를 알아볼 수 있을까?",
    "slug":  "ai-vs-human",
    "description":  "이미지, 음성, 글로 구성된 짧은 식별 실험과 자기보고 문항입니다. 모든 응답은 익명으로 저장되며, 통계 연구에만 사용됩니다.",
    "questions":  [
                      {
                          "maxLength":  24,
                          "id":  "q1",
                          "required":  false,
                          "type":  "short",
                          "hint":  "결과 페이지에서만 보입니다. 비워두면 무작위로 생성됩니다.",
                          "title":  "닉네임을 알려주세요.",
                          "placeholder":  "예) 쿼카"
                      },
                      {
                          "id":  "q2",
                          "type":  "dropdown",
                          "options":  [
                                          "중학생",
                                          "고등학생",
                                          "20대",
                                          "30대",
                                          "40대",
                                          "50대",
                                          "60대 이상"
                                      ],
                          "required":  true,
                          "title":  "연령대를 선택해주세요."
                      },
                      {
                          "id":  "q3",
                          "type":  "single",
                          "options":  [
                                          "거의 사용하지 않았다",
                                          "한 달에 1~2번",
                                          "일주일에 1~2번",
                                          "일주일에 3~5번",
                                          "거의 매일",
                                          "하루에도 여러 번"
                                      ],
                          "required":  true,
                          "title":  "최근 한 달 동안 생성형 AI 서비스를 얼마나 자주 사용했나요?"
                      },
                      {
                          "id":  "q4",
                          "options":  [
                                          "ChatGPT",
                                          "Claude",
                                          "Gemini",
                                          "Copilot",
                                          "Perplexity",
                                          "Manus",
                                          "Genspark",
                                          "뤼튼 / 네이버 클로바X 등 국내 AI 서비스",
                                          "Midjourney / DALL·E / Stable Diffusion 등 이미지 생성 AI",
                                          "Suno / Udio 등 음악·음성 생성 AI",
                                          "사용해 본 적 없다",
                                          "기타"
                                      ],
                          "type":  "multi",
                          "required":  true,
                          "title":  "사용해 본 생성형 AI 서비스를 모두 선택해주세요.",
                          "hint":  "최근에 사용하지 않았더라도 사용 경험이 있으면 선택해주세요."
                      },
                      {
                          "required":  true,
                          "type":  "multi",
                          "options":  [
                                          "정보 검색 / 질문",
                                          "글쓰기 / 문장 다듬기",
                                          "과제 / 공부",
                                          "코딩 / 개발",
                                          "번역",
                                          "이미지·영상·음성 생성",
                                          "아이디어 정리",
                                          "재미 / 대화",
                                          "거의 사용하지 않는다",
                                          "기타"
                                      ],
                          "id":  "q5",
                          "title":  "생성형 AI를 주로 어떤 목적으로 사용하나요?"
                      },
                      {
                          "title":  "나는 일상적인 작업에서 AI에 어느 정도 의존하고 있다고 느낀다.",
                          "id":  "q6",
                          "labels":  [
                                         "전혀 의존하지 않음",
                                         "매우 의존함"
                                     ],
                          "required":  true,
                          "scale":  5,
                          "type":  "scale"
                      },
                      {
                          "labels":  [
                                         "전혀 의식하지 않음",
                                         "매우 자주 의식함"
                                     ],
                          "id":  "q7",
                          "required":  true,
                          "scale":  5,
                          "type":  "scale",
                          "title":  "AI를 사용할 때, 내가 AI에 의존하고 있다는 사실을 의식하는 편이다."
                      },
                      {
                          "title":  "온라인에서 AI가 만든 것으로 보이는 콘텐츠를 얼마나 자주 접하나요?",
                          "id":  "q8",
                          "required":  true,
                          "options":  [
                                          "거의 접하지 않는다",
                                          "가끔 접한다",
                                          "종종 접한다",
                                          "자주 접한다",
                                          "매우 자주 접한다"
                                      ],
                          "type":  "single"
                      },
                      {
                          "title":  "AI가 만든 것으로 보이는 콘텐츠를 접할 때 불쾌감을 느끼는 편인가요?",
                          "id":  "q9",
                          "labels":  [
                                         "전혀 불쾌하지 않음",
                                         "매우 불쾌함"
                                     ],
                          "required":  true,
                          "scale":  5,
                          "type":  "scale"
                      },
                      {
                          "type":  "single",
                          "options":  [
                                          "AI가 생성했다",
                                          "사람이 만들었다",
                                          "잘 모르겠다"
                                      ],
                          "required":  true,
                          "id":  "q10",
                          "media":  {
                                        "kind":  "image",
                                        "label":  "image · ai-or-real_03.png",
                                        "ratio":  "16 / 9"
                                    },
                          "title":  "이 이미지는 AI가 생성한 것일까요?"
                      },
                      {
                          "media":  {
                                        "ratio":  "16 / 9",
                                        "label":  "image · ai-or-real_03.png",
                                        "kind":  "image"
                                    },
                          "title":  "AI가 생성했다고 의심한 단서를 모두 골라주세요.",
                          "hint":  "최소 1개 이상 선택해주세요.",
                          "id":  "q11",
                          "options":  [
                                          "비현실적인 디테일 (손가락 / 텍스트 등)",
                                          "조명·그림자 일관성이 어색하다",
                                          "배경 요소가 반복되거나 부자연스럽다",
                                          "피부·머리카락의 질감이 너무 균일하다",
                                          "확신할 수는 없지만 그냥 느낌이다"
                                      ],
                          "type":  "multi",
                          "required":  true
                      },
                      {
                          "title":  "당신의 판단에 대한 확신 정도는?",
                          "id":  "q12",
                          "min":  0,
                          "step":  1,
                          "unit":  "%",
                          "max":  100,
                          "labels":  [
                                         "전혀 확신 없음",
                                         "매우 확신함"
                                     ],
                          "required":  true,
                          "type":  "slider"
                      },
                      {
                          "id":  "q13",
                          "type":  "single",
                          "options":  [
                                          "사람",
                                          "AI",
                                          "구별할 수 없다"
                                      ],
                          "required":  true,
                          "title":  "이 음성의 화자는 사람일까요, AI일까요?",
                          "media":  {
                                        "kind":  "audio",
                                        "label":  "audio · clip_01.mp3 · 0:38"
                                    }
                      },
                      {
                          "hint":  "한두 문장이면 충분합니다.",
                          "title":  "그렇게 판단한 이유를 적어주세요.",
                          "placeholder":  "예) 호흡이 너무 일정하고, 자음 끝맺음이 부자연스러웠다...",
                          "maxLength":  400,
                          "id":  "q14",
                          "required":  false,
                          "type":  "long"
                      },
                      {
                          "title":  "이 음성의 자연스러움은 어느 정도였나요?",
                          "required":  true,
                          "scale":  7,
                          "type":  "scale",
                          "labels":  [
                                         "매우 부자연스러움",
                                         "매우 자연스러움"
                                     ],
                          "id":  "q15"
                      },
                      {
                          "required":  true,
                          "type":  "single",
                          "options":  [
                                          "사람",
                                          "AI",
                                          "구별할 수 없다"
                                      ],
                          "id":  "q16",
                          "media":  {
                                        "body":  "늦은 오후, 도서관 창가에 앉아 책장 너머의 빛이 비스듬히 떨어지는 모습을 바라본다. 사람들의 발걸음이 모래시계처럼 천천히 지나가고, 종이 위에 쌓이는 햇살은 어떤 단어보다도 정확하게 시간을 묘사한다.\n\n그 풍경 속에서 나는 한 문장을 오래 붙들고 있었다. 의미는 분명한데, 그 의미가 무엇이었는지는 또렷이 떠오르지 않는다.",
                                        "kind":  "text"
                                    },
                          "title":  "다음 글은 사람이 썼을까요, AI가 썼을까요?"
                      },
                      {
                          "id":  "q17",
                          "required":  true,
                          "type":  "ranking",
                          "options":  [
                                          "글 A · 도서관 풍경",
                                          "글 B · 카페 후기",
                                          "글 C · 개발 일지",
                                          "글 D · 시"
                                      ],
                          "hint":  "위가 가장 AI 같음, 아래가 가장 사람 같음.",
                          "title":  "AI가 작성했을 가능성이 높은 글 순서대로 정렬해주세요."
                      },
                      {
                          "cols":  [
                                       "전혀 아님",
                                       "아님",
                                       "보통",
                                       "그렇다",
                                       "매우 그렇다"
                                   ],
                          "id":  "q18",
                          "type":  "matrix",
                          "scale":  5,
                          "required":  true,
                          "title":  "다음 항목들에 동의하는 정도를 표시해주세요.",
                          "rows":  [
                                       {
                                           "text":  "AI가 만든 이미지를 자주 본 적이 있다.",
                                           "id":  "r1"
                                       },
                                       {
                                           "id":  "r2",
                                           "text":  "AI 생성물에 거부감이 든다."
                                       },
                                       {
                                           "text":  "내 직업 / 취미에 AI가 영향을 준다고 느낀다.",
                                           "id":  "r3"
                                       },
                                       {
                                           "id":  "r4",
                                           "text":  "AI와 사람의 결과물 차이를 구별할 자신이 있다."
                                       }
                                   ]
                      },
                      {
                          "placeholder":  "you@example.com | 010-1234-5678",
                          "hint":  "선택 사항입니다. 상품 추첨에 당첨되시면 아래 연락처로 상품을 지급해드릴 예정입니다. 상품은 총 7개 입니다.",
                          "title":  "상품 추첨에 참여하시려면 연락처를 남겨주세요!",
                          "required":  false,
                          "type":  "contact",
                          "id":  "q19"
                      }
                  ],
    "title":  "사람들은 AI가 만든 콘텐츠를 알아볼 수 있을까?"
};

