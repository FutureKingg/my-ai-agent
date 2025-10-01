// 업종별 카테고리 및 예약 시스템 매핑

export interface IndustryCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  bookingSystems: string[];
  defaultSettings: {
    greeting: string;
    companyName: string;
    serviceTypes: string[];
    businessHours: string;
    location: string;
  };
}

export const industryCategories: IndustryCategory[] = [
  {
    id: 'beauty',
    name: '미용/헤어/네일',
    description: '헤어샵, 네일샵, 피부관리실 등 미용 관련 업체',
    icon: '💇‍♀️',
    color: 'pink',
    bookingSystems: ['naver', 'kakao', 'bookingKing'],
    defaultSettings: {
      greeting: '안녕하세요! 아름다운 하루를 만들어드리는 미용실입니다. 어떤 서비스를 도와드릴까요?',
      companyName: '예쁜미용실',
      serviceTypes: ['헤어컷', '펌', '염색', '네일아트', '피부관리'],
      businessHours: '평일 09:00-21:00, 토요일 09:00-19:00, 일요일 휴무',
      location: '서울시 강남구'
    }
  },
  {
    id: 'restaurant',
    name: '음식점/카페',
    description: '레스토랑, 카페, 베이커리 등 음식 관련 업체',
    icon: '🍽️',
    color: 'orange',
    bookingSystems: ['tableManager', 'catchTable', 'naver'],
    defaultSettings: {
      greeting: '안녕하세요! 맛있는 음식으로 고객님을 맞이하는 레스토랑입니다. 예약을 도와드릴까요?',
      companyName: '맛있는식당',
      serviceTypes: ['점심식사', '저녁식사', '브런치', '카페', '베이커리'],
      businessHours: '평일 11:00-22:00, 주말 10:00-23:00',
      location: '서울시 홍대'
    }
  },
  {
    id: 'medical',
    name: '의료/치과/한의원',
    description: '병원, 치과, 한의원, 피부과 등 의료 관련 업체',
    icon: '🏥',
    color: 'blue',
    bookingSystems: ['naver', 'kakao', 'medicalBooking'],
    defaultSettings: {
      greeting: '안녕하세요! 건강한 하루를 위한 의료진입니다. 진료 예약을 도와드릴까요?',
      companyName: '건강한병원',
      serviceTypes: ['일반진료', '검진', '치과진료', '한의진료', '피부과진료'],
      businessHours: '평일 09:00-18:00, 토요일 09:00-13:00, 일요일 휴무',
      location: '서울시 서초구'
    }
  },
  {
    id: 'fitness',
    name: '헬스/요가/필라테스',
    description: '헬스장, 요가원, 필라테스, 수영장 등 운동 관련 업체',
    icon: '💪',
    color: 'green',
    bookingSystems: ['naver', 'kakao', 'fitnessBooking'],
    defaultSettings: {
      greeting: '안녕하세요! 건강한 몸을 만들어드리는 피트니스 센터입니다. 수업 예약을 도와드릴까요?',
      companyName: '건강한헬스',
      serviceTypes: ['헬스', '요가', '필라테스', '수영', '개인PT'],
      businessHours: '평일 06:00-23:00, 주말 08:00-22:00',
      location: '서울시 강남구'
    }
  },
  {
    id: 'education',
    name: '학원/과외/교육',
    description: '학원, 과외, 어학원, 취업학원 등 교육 관련 업체',
    icon: '📚',
    color: 'purple',
    bookingSystems: ['naver', 'kakao', 'educationBooking'],
    defaultSettings: {
      greeting: '안녕하세요! 꿈을 향한 학습을 도와드리는 교육기관입니다. 수강 상담을 도와드릴까요?',
      companyName: '꿈을키우는학원',
      serviceTypes: ['개인과외', '그룹수업', '온라인수업', '시험대비', '어학수업'],
      businessHours: '평일 14:00-22:00, 토요일 09:00-18:00, 일요일 휴무',
      location: '서울시 강남구'
    }
  },
  {
    id: 'automotive',
    name: '자동차/정비/세차',
    description: '자동차 정비소, 세차장, 카센터 등 자동차 관련 업체',
    icon: '🚗',
    color: 'gray',
    bookingSystems: ['naver', 'kakao', 'autoBooking'],
    defaultSettings: {
      greeting: '안녕하세요! 안전한 운전을 위한 자동차 정비소입니다. 정비 예약을 도와드릴까요?',
      companyName: '안전한정비소',
      serviceTypes: ['정기점검', '수리', '세차', '타이어교체', '오일교체'],
      businessHours: '평일 08:00-19:00, 토요일 08:00-17:00, 일요일 휴무',
      location: '서울시 송파구'
    }
  },
  {
    id: 'pet',
    name: '펫샵/동물병원',
    description: '펫샵, 동물병원, 펫호텔 등 반려동물 관련 업체',
    icon: '🐕',
    color: 'yellow',
    bookingSystems: ['naver', 'kakao', 'petBooking'],
    defaultSettings: {
      greeting: '안녕하세요! 소중한 반려동물을 위한 펫샵입니다. 서비스 예약을 도와드릴까요?',
      companyName: '사랑하는펫샵',
      serviceTypes: ['목욕', '미용', '진료', '호텔', '훈련'],
      businessHours: '평일 09:00-20:00, 토요일 09:00-18:00, 일요일 휴무',
      location: '서울시 마포구'
    }
  },
  {
    id: 'wedding',
    name: '웨딩/스튜디오',
    description: '웨딩홀, 스튜디오, 드레스샵 등 웨딩 관련 업체',
    icon: '💒',
    color: 'rose',
    bookingSystems: ['naver', 'kakao', 'weddingBooking'],
    defaultSettings: {
      greeting: '안녕하세요! 특별한 순간을 만들어드리는 웨딩홀입니다. 예식 예약을 도와드릴까요?',
      companyName: '특별한웨딩홀',
      serviceTypes: ['예식', '스튜디오촬영', '드레스대여', '헤어메이크업', '부케'],
      businessHours: '평일 09:00-19:00, 토요일 09:00-18:00, 일요일 휴무',
      location: '서울시 강남구'
    }
  },
  {
    id: 'personalAssistant',
    name: '개인 비서',
    description: '개인 비서, 가정부, 라이프 스타일 매니저 등 개인 서비스',
    icon: '👤',
    color: 'indigo',
    bookingSystems: ['naver', 'kakao'],
    defaultSettings: {
      greeting: '안녕하세요! 개인 비서 서비스를 제공합니다. 일정 관리, 업무 지원, 생활 도우미 등 어떤 도움이 필요하신가요?',
      companyName: '프리미엄비서',
      serviceTypes: ['일정관리', '업무지원', '생활도우미', '쇼핑대행', '여행계획'],
      businessHours: '평일 08:00-20:00, 주말 09:00-18:00',
      location: '서울시'
    }
  },
  {
    id: 'other',
    name: '기타 서비스',
    description: '기타 서비스업체 (세탁소, 수리점, 청소업체 등)',
    icon: '🔧',
    color: 'slate',
    bookingSystems: ['naver', 'kakao'],
    defaultSettings: {
      greeting: '안녕하세요! 고객님의 편의를 위해 최선을 다하는 서비스업체입니다. 어떤 도움이 필요하신가요?',
      companyName: '편리한서비스',
      serviceTypes: ['일반서비스', '수리', '청소', '배송', '상담'],
      businessHours: '평일 09:00-18:00, 토요일 09:00-17:00, 일요일 휴무',
      location: '서울시'
    }
  }
];

// 업종별 예약 시스템 매핑
export const getBookingSystemsByIndustry = (industryId: string): string[] => {
  const category = industryCategories.find(cat => cat.id === industryId);
  return category ? category.bookingSystems : ['naver', 'kakao'];
};

// 업종별 기본 설정 가져오기
export const getDefaultSettingsByIndustry = (industryId: string) => {
  const category = industryCategories.find(cat => cat.id === industryId);
  return category ? category.defaultSettings : industryCategories[8].defaultSettings; // 기타 서비스 기본값
};

// 업종별 색상 가져오기
export const getIndustryColor = (industryId: string): string => {
  const category = industryCategories.find(cat => cat.id === industryId);
  return category ? category.color : 'slate';
};

// 업종별 아이콘 가져오기
export const getIndustryIcon = (industryId: string): string => {
  const category = industryCategories.find(cat => cat.id === industryId);
  return category ? category.icon : '🔧';
};
