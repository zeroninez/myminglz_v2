'use client';

import { useState } from 'react';
import { Box, Container, Heading, Text, VStack, useToast } from '@chakra-ui/react';
import { QRScanner } from '@/components/QRScanner';
import { CouponService } from '@myminglz/core';

export default function POSPage() {
  const [scanning, setScanning] = useState(false);
  const toast = useToast();

  const handleScan = async (qrData: string) => {
    try {
      // QR 코드에서 쿠폰 정보 파싱
      const params = new URLSearchParams(qrData.split('?')[1]);
      const storeId = params.get('store');
      const type = params.get('type');

      if (!storeId || !type) {
        throw new Error('유효하지 않은 QR 코드입니다.');
      }

      // 쿠폰 검증 및 사용 처리
      if (type === 'use') {
        const result = await CouponService.validateCodeAtStore(qrData, storeId);
        if (result.success && result.isValid && !result.isUsed) {
          toast({
            title: '쿠폰 확인 완료',
            description: '유효한 쿠폰입니다. 사용 처리하시겠습니까?',
            status: 'success',
          });
        } else {
          throw new Error(result.error || '유효하지 않은 쿠폰입니다.');
        }
      }
    } catch (error) {
      toast({
        title: '오류 발생',
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        status: 'error',
      });
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6}>
        <Heading>매장 쿠폰 관리</Heading>
        <Box w="full" p={6} borderWidth={1} borderRadius="lg">
          <VStack spacing={4}>
            <Text fontSize="lg" fontWeight="bold">
              쿠폰 스캔
            </Text>
            <QRScanner onScan={handleScan} />
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}



