// 음성 인식 필터링 및 정확도 개선 시스템

export interface SpeechRecognitionResult {
  text: string;
  confidence: number;
  isFiltered: boolean;
  originalText?: string;
  language?: string;
}

export class SpeechRecognitionFilter {
  // 한국어 키워드 패턴 (일반적인 대화)
  // 이 패턴들이 있으면 한국어로 인식하여 우선 처리
  private static readonly KOREAN_PATTERNS = [
    /안녕하세요/,
    /감사합니다/,
    /네|예|아니요/,
    /좋습니다|괜찮습니다/,
    /도와주세요|도와드릴까요/,
    /예약|예약하고 싶습니다/,
    /시간|언제|몇 시/,
    /이름|성함/,
    /전화번호|연락처/,
    /주소|위치/,
    /가격|비용|돈/,
    /메뉴|음식|음료/,
    /서비스|상담/,
    /문제|궁금|질문/
  ];

  // 기본 영어 패턴 (통과시킬 영어)
  // 기본적인 영어는 정상적으로 인식되도록 허용
  private static readonly ENGLISH_PATTERNS = [
    /hello|hi|hey/i,
    /thank you|thanks/i,
    /yes|no|ok|okay/i,
    /please|sorry/i,
    /help|reservation|book/i,
    /time|when|where|what/i,
    /name|phone|address/i,
    /price|cost|money/i,
    /menu|food|drink/i,
    /service|help|question/i
  ];

  // 잘못 인식된 외국어 패턴 (필터링 대상)
  // 기본 영어는 통과시키고, 뜬금없이 나올 수 없는 언어들만 필터링
  private static readonly FOREIGN_PATTERNS = [
    // 1-2글자 짧은 영어 (잘못 인식된 것)
    /^[a-zA-Z]{1,2}$/,
    // 뜬금없이 나올 수 없는 언어들 (인도어, 아랍어, 중국어 등)
    /^[\u0900-\u097F]+$/, // 데바나가리 문자 (힌디어)
    /^[\u0600-\u06FF]+$/, // 아랍어
    /^[\u4E00-\u9FFF]+$/, // 중국어 한자
    /^[\u3040-\u309F\u30A0-\u30FF]+$/, // 일본어 히라가나/가타카나
    /^[\u0400-\u04FF]+$/, // 키릴 문자 (러시아어)
    /^[\u0100-\u017F]+$/, // 라틴 확장 (프랑스어, 독일어 등)
    // 아프리카 언어들 (스와힐리어 등)
    /kutoka|kwa|mwanga|jambo|habari|asante|karibu/i,
    /^[a-zA-Z\s]*kutoka[a-zA-Z\s]*$/i,
    /^[a-zA-Z\s]*kwa[a-zA-Z\s]*$/i,
    /^[a-zA-Z\s]*mwanga[a-zA-Z\s]*$/i,
    // 숫자와 특수문자만
    /^[0-9\s\-\(\)]+$/,
    /^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/
  ];

  // 추가 필터링 패턴 (더 강력한 필터링)
  private static readonly STRICT_FILTER_PATTERNS = [
    // 단어가 완성되지 않은 것들
    /^[a-zA-Z]{1,3}\s*$/, // 1-3글자 영어 단어만
    /^[a-zA-Z]+\s+[a-zA-Z]{1,2}$/, // "I have" 같은 불완전한 문장
    /^[a-zA-Z]+\s+de\s*$/, // "have de" 같은 이상한 조합
    /^[a-zA-Z]+\s+[a-zA-Z]{1,2}\s*$/, // "have de" 같은 패턴
    // 의미없는 영어 조합
    /^(I|you|he|she|it|we|they)\s+(have|has|had|am|is|are|was|were)\s*$/i,
    /^(the|a|an)\s+[a-zA-Z]{1,2}\s*$/i,
    // 반복되는 문자
    /^([a-zA-Z])\1{2,}$/, // "aaa", "bbb" 같은 것
  ];

  // 잡음/무의미한 패턴
  private static readonly NOISE_PATTERNS = [
    /^[aeiou]+$/i, // 모음만
    /^[bcdfghjklmnpqrstvwxyz]+$/i, // 자음만
    /^[hm]+$/i, // 흠, 음 등
    /^[ah]+$/i, // 아, 어 등
    /^.{1,2}$/, // 1-2글자 짧은 텍스트
    /^[0-9]+$/, // 숫자만
    /^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/ // 특수문자만
  ];

  // 신뢰도 임계값 (더 엄격하게)
  private static readonly CONFIDENCE_THRESHOLD = 0.8;
  private static readonly MIN_TEXT_LENGTH = 3;

  /**
   * 음성 인식 결과를 필터링하여 정확도를 개선합니다
   * 
   * 🎯 필터링 대상:
   * - 잡음으로 인한 무의미한 텍스트 ("음", "어", "흠" 등)
   * - 뜬금없이 나올 수 없는 언어들 (인도어, 아랍어, 중국어 등)
   * - 낮은 신뢰도의 텍스트
   * 
   * ✅ 통과하는 텍스트:
   * - 한국어로 명확히 말한 내용
   * - 기본적인 영어 ("hello", "thank you", "yes", "no" 등)
   * - 높은 신뢰도의 텍스트
   * 
   * @param text 원본 인식 텍스트
   * @param confidence 신뢰도 (0-1)
   * @returns 필터링된 결과
   */
  static filterRecognitionResult(text: string, confidence: number = 1.0): SpeechRecognitionResult {
    const originalText = text;
    let filteredText = text.trim();
    let isFiltered = false;
    let language = 'unknown';

    // 1. 기본 길이 체크
    if (filteredText.length < this.MIN_TEXT_LENGTH) {
      return {
        text: '',
        confidence: 0,
        isFiltered: true,
        originalText,
        language: 'too_short'
      };
    }

    // 2. 신뢰도 체크
    if (confidence < this.CONFIDENCE_THRESHOLD) {
      return {
        text: '',
        confidence,
        isFiltered: true,
        originalText,
        language: 'low_confidence'
      };
    }

    // 3. 영어 패턴 우선 체크 (기본 영어는 통과)
    if (this.isEnglishPattern(filteredText)) {
      return {
        text: filteredText,
        confidence,
        isFiltered: false,
        originalText,
        language: 'english'
      };
    }

    // 4. 강력한 필터링 패턴 체크 (불완전한 문장들)
    if (this.isStrictFilterPattern(filteredText)) {
      return {
        text: '',
        confidence: 0,
        isFiltered: true,
        originalText,
        language: 'incomplete'
      };
    }

    // 5. 잡음 패턴 체크
    if (this.isNoisePattern(filteredText)) {
      return {
        text: '',
        confidence: 0,
        isFiltered: true,
        originalText,
        language: 'noise'
      };
    }

    // 6. 외국어 패턴 체크 (뜬금없는 언어들만)
    if (this.isForeignPattern(filteredText)) {
      return {
        text: '',
        confidence: 0,
        isFiltered: true,
        originalText,
        language: 'foreign'
      };
    }

    // 5. 한국어 패턴 체크
    if (this.isKoreanPattern(filteredText)) {
      language = 'korean';
    } else {
      // 한국어가 아니지만 유의미한 텍스트인 경우
      language = 'mixed';
    }

    // 6. 텍스트 정제
    filteredText = this.cleanText(filteredText);

    return {
      text: filteredText,
      confidence,
      isFiltered: false,
      originalText,
      language
    };
  }

  // 잡음 패턴 체크
  private static isNoisePattern(text: string): boolean {
    return this.NOISE_PATTERNS.some(pattern => pattern.test(text));
  }

  // 외국어 패턴 체크
  private static isForeignPattern(text: string): boolean {
    return this.FOREIGN_PATTERNS.some(pattern => pattern.test(text));
  }

  // 영어 패턴 체크
  private static isEnglishPattern(text: string): boolean {
    return this.ENGLISH_PATTERNS.some(pattern => pattern.test(text));
  }

  // 강력한 필터링 패턴 체크 (불완전한 문장들)
  private static isStrictFilterPattern(text: string): boolean {
    return this.STRICT_FILTER_PATTERNS.some(pattern => pattern.test(text));
  }

  // 한국어 패턴 체크
  private static isKoreanPattern(text: string): boolean {
    // 한글 포함 여부
    const hasKorean = /[\uAC00-\uD7AF]/.test(text);
    
    // 한국어 키워드 패턴 매칭
    const hasKoreanKeywords = this.KOREAN_PATTERNS.some(pattern => pattern.test(text));
    
    return hasKorean || hasKoreanKeywords;
  }

  // 텍스트 정제
  private static cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // 여러 공백을 하나로
      .replace(/[^\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\s]/g, '') // 한글과 공백만 유지
      .trim();
  }

  // 실시간 음성 인식 품질 모니터링
  static monitorRecognitionQuality(results: SpeechRecognitionResult[]): {
    qualityScore: number;
    recommendations: string[];
    filteredCount: number;
  } {
    const totalResults = results.length;
    const filteredResults = results.filter(r => r.isFiltered).length;
    const koreanResults = results.filter(r => r.language === 'korean').length;
    
    const qualityScore = totalResults > 0 ? (koreanResults / totalResults) * 100 : 0;
    const filteredCount = filteredResults;
    
    const recommendations: string[] = [];
    
    if (qualityScore < 50) {
      recommendations.push('마이크를 더 가까이 하세요');
      recommendations.push('주변 소음을 줄여주세요');
    }
    
    if (filteredCount > totalResults * 0.3) {
      recommendations.push('더 명확하게 발음해주세요');
      recommendations.push('한국어로 말씀해주세요');
    }
    
    return {
      qualityScore,
      recommendations,
      filteredCount
    };
  }

  // 사용자 피드백 기반 학습
  static learnFromFeedback(originalText: string, userFeedback: 'correct' | 'incorrect'): void {
    // 실제로는 사용자 피드백을 저장하고 패턴을 학습
    console.log('사용자 피드백 학습:', { originalText, userFeedback });
    
    // 나중에 머신러닝 모델에 추가할 수 있음
    if (userFeedback === 'incorrect') {
      // 잘못 인식된 패턴을 학습 데이터에 추가
      this.addToFilterPatterns(originalText);
    }
  }

  // 필터 패턴에 추가
  private static addToFilterPatterns(text: string): void {
    // 실제로는 데이터베이스나 설정 파일에 저장
    console.log('필터 패턴 추가:', text);
  }
}

// 실시간 음성 인식 품질 추적
export class SpeechQualityTracker {
  private static recognitionHistory: SpeechRecognitionResult[] = [];
  private static maxHistorySize = 100;

  // 인식 결과 추가
  static addRecognitionResult(result: SpeechRecognitionResult): void {
    this.recognitionHistory.push(result);
    
    // 히스토리 크기 제한
    if (this.recognitionHistory.length > this.maxHistorySize) {
      this.recognitionHistory.shift();
    }
  }

  // 품질 통계 조회
  static getQualityStats(): {
    totalRecognitions: number;
    successfulRecognitions: number;
    filteredRecognitions: number;
    averageConfidence: number;
    koreanRatio: number;
  } {
    const total = this.recognitionHistory.length;
    const successful = this.recognitionHistory.filter(r => !r.isFiltered).length;
    const filtered = this.recognitionHistory.filter(r => r.isFiltered).length;
    const korean = this.recognitionHistory.filter(r => r.language === 'korean').length;
    
    const averageConfidence = this.recognitionHistory.length > 0 
      ? this.recognitionHistory.reduce((sum, r) => sum + r.confidence, 0) / this.recognitionHistory.length
      : 0;
    
    return {
      totalRecognitions: total,
      successfulRecognitions: successful,
      filteredRecognitions: filtered,
      averageConfidence,
      koreanRatio: total > 0 ? (korean / total) * 100 : 0
    };
  }

  // 히스토리 초기화
  static clearHistory(): void {
    this.recognitionHistory = [];
  }
}
