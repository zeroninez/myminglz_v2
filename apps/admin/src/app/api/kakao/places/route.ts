import { NextRequest, NextResponse } from 'next/server';

const KAKAO_REST_API_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY || process.env.KAKAO_REST_API_KEY;

export async function GET(request: NextRequest) {
  try {
    if (!KAKAO_REST_API_KEY) {
      return NextResponse.json(
        { success: false, error: '카카오 API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');

    if (!query || query.trim() === '') {
      return NextResponse.json(
        { success: false, error: '검색어를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 카카오 장소 검색 API 호출
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query.trim())}&size=15`,
      {
        method: 'GET',
        headers: {
          Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('카카오 API 오류:', errorData);
      return NextResponse.json(
        { success: false, error: '장소 검색에 실패했습니다.' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // 응답 데이터 가공
    const places = data.documents.map((place: any) => ({
      id: place.id,
      placeName: place.place_name,
      addressName: place.address_name,
      roadAddressName: place.road_address_name,
      categoryName: place.category_name,
      phone: place.phone,
      x: place.x, // 경도
      y: place.y, // 위도
      placeUrl: place.place_url,
    }));

    return NextResponse.json({
      success: true,
      data: places,
      meta: data.meta,
    });
  } catch (error: any) {
    console.error('장소 검색 API 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '장소 검색 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

