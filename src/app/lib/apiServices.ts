// API 연동 서비스들

// 예약 시스템 API
export class BookingAPI {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_BOOKING_API_URL || '') {
    this.baseUrl = baseUrl;
  }

  // 예약 조회
  async getBookings(date?: string) {
    try {
      const response = await fetch(`${this.baseUrl}/bookings${date ? `?date=${date}` : ''}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BOOKING_API_KEY}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('예약 조회 실패:', error);
      throw error;
    }
  }

  // 예약 생성
  async createBooking(bookingData: {
    customerName: string;
    customerPhone: string;
    serviceType: string;
    date: string;
    time: string;
    notes?: string;
  }) {
    try {
      const response = await fetch(`${this.baseUrl}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BOOKING_API_KEY}`
        },
        body: JSON.stringify(bookingData)
      });
      return await response.json();
    } catch (error) {
      console.error('예약 생성 실패:', error);
      throw error;
    }
  }

  // 예약 수정
  async updateBooking(bookingId: string, updateData: any) {
    try {
      const response = await fetch(`${this.baseUrl}/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BOOKING_API_KEY}`
        },
        body: JSON.stringify(updateData)
      });
      return await response.json();
    } catch (error) {
      console.error('예약 수정 실패:', error);
      throw error;
    }
  }

  // 예약 취소
  async cancelBooking(bookingId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BOOKING_API_KEY}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('예약 취소 실패:', error);
      throw error;
    }
  }

  // 예약 가능 시간 조회
  async getAvailableSlots(date: string, serviceType: string) {
    try {
      const response = await fetch(`${this.baseUrl}/bookings/available-slots?date=${date}&service=${serviceType}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BOOKING_API_KEY}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('예약 가능 시간 조회 실패:', error);
      throw error;
    }
  }
}

// CRM 시스템 API
export class CRMAPI {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_CRM_API_URL || '') {
    this.baseUrl = baseUrl;
  }

  // 고객 조회
  async getCustomers(searchParams?: {
    name?: string;
    email?: string;
    phone?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      const params = new URLSearchParams();
      if (searchParams) {
        Object.entries(searchParams).forEach(([key, value]) => {
          if (value) params.append(key, value.toString());
        });
      }

      const response = await fetch(`${this.baseUrl}/customers?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CRM_API_KEY}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('고객 조회 실패:', error);
      throw error;
    }
  }

  // 고객 생성
  async createCustomer(customerData: {
    name: string;
    email: string;
    phone: string;
    company?: string;
    notes?: string;
  }) {
    try {
      const response = await fetch(`${this.baseUrl}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CRM_API_KEY}`
        },
        body: JSON.stringify(customerData)
      });
      return await response.json();
    } catch (error) {
      console.error('고객 생성 실패:', error);
      throw error;
    }
  }

  // 고객 정보 수정
  async updateCustomer(customerId: string, updateData: any) {
    try {
      const response = await fetch(`${this.baseUrl}/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CRM_API_KEY}`
        },
        body: JSON.stringify(updateData)
      });
      return await response.json();
    } catch (error) {
      console.error('고객 정보 수정 실패:', error);
      throw error;
    }
  }

  // 통화 기록 생성
  async createCallRecord(callData: {
    customerId: string;
    duration: number;
    type: 'inbound' | 'outbound';
    status: 'completed' | 'missed' | 'cancelled';
    transcript?: string;
    summary?: string;
  }) {
    try {
      const response = await fetch(`${this.baseUrl}/call-records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CRM_API_KEY}`
        },
        body: JSON.stringify(callData)
      });
      return await response.json();
    } catch (error) {
      console.error('통화 기록 생성 실패:', error);
      throw error;
    }
  }

  // 고객 통화 기록 조회
  async getCustomerCallHistory(customerId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/customers/${customerId}/call-history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CRM_API_KEY}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('고객 통화 기록 조회 실패:', error);
      throw error;
    }
  }

  // 고객 분석 데이터 조회
  async getCustomerAnalytics(customerId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/customers/${customerId}/analytics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CRM_API_KEY}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('고객 분석 데이터 조회 실패:', error);
      throw error;
    }
  }
}

// 통합 API 서비스
export class IntegratedAPIService {
  private bookingAPI: BookingAPI;
  private crmAPI: CRMAPI;

  constructor() {
    this.bookingAPI = new BookingAPI();
    this.crmAPI = new CRMAPI();
  }

  // 예약과 CRM 통합 - 예약 생성 시 고객 정보도 함께 처리
  async createBookingWithCustomer(bookingData: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    serviceType: string;
    date: string;
    time: string;
    notes?: string;
  }) {
    try {
      // 1. CRM에서 고객 조회 또는 생성
      let customer;
      try {
        const existingCustomers = await this.crmAPI.getCustomers({
          phone: bookingData.customerPhone
        });
        
        if (existingCustomers.data && existingCustomers.data.length > 0) {
          customer = existingCustomers.data[0];
        } else {
          // 새 고객 생성
          customer = await this.crmAPI.createCustomer({
            name: bookingData.customerName,
            email: bookingData.customerEmail || '',
            phone: bookingData.customerPhone,
            notes: 'AI CallBot을 통해 예약 생성'
          });
        }
      } catch (error) {
        console.error('고객 정보 처리 실패:', error);
      }

      // 2. 예약 생성
      const booking = await this.bookingAPI.createBooking({
        customerName: bookingData.customerName,
        customerPhone: bookingData.customerPhone,
        serviceType: bookingData.serviceType,
        date: bookingData.date,
        time: bookingData.time,
        notes: bookingData.notes
      });

      return {
        booking,
        customer,
        success: true
      };
    } catch (error) {
      console.error('통합 예약 생성 실패:', error);
      throw error;
    }
  }

  // 통화 완료 후 CRM에 기록 저장
  async recordCallCompletion(callData: {
    customerPhone: string;
    duration: number;
    transcript: string;
    summary: string;
    bookingId?: string;
  }) {
    try {
      // 1. 고객 조회
      const customers = await this.crmAPI.getCustomers({
        phone: callData.customerPhone
      });

      if (customers.data && customers.data.length > 0) {
        const customer = customers.data[0];
        
        // 2. 통화 기록 생성
        const callRecord = await this.crmAPI.createCallRecord({
          customerId: customer.id,
          duration: callData.duration,
          type: 'inbound',
          status: 'completed',
          transcript: callData.transcript,
          summary: callData.summary
        });

        return {
          callRecord,
          customer,
          success: true
        };
      } else {
        throw new Error('고객 정보를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('통화 기록 저장 실패:', error);
      throw error;
    }
  }
}

// API 인스턴스 생성
export const bookingAPI = new BookingAPI();
export const crmAPI = new CRMAPI();
export const integratedAPI = new IntegratedAPIService();
