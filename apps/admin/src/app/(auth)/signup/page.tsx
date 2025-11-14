'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'verify' | 'info'>('email');
  const [formData, setFormData] = useState({
    email: '',
    verificationCode: '',
    name: '', // 회사명으로 사용
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccessMessage('');
  };

  // 1단계: 이메일로 인증 코드 전송
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSendingCode(true);

    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('인증 코드가 이메일로 전송되었습니다.');
        setStep('verify');
      } else {
        setError(data.error || '인증 코드 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('인증 코드 전송 실패:', error);
      setError('인증 코드 전송에 실패했습니다.');
    } finally {
      setIsSendingCode(false);
    }
  };

  // 2단계: 인증 코드 확인
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          code: formData.verificationCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('이메일 인증이 완료되었습니다.');
        setStep('info');
      } else {
        setError(data.error || '잘못된 인증 코드입니다.');
      }
    } catch (error) {
      console.error('인증 실패:', error);
      setError('인증에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3단계: 계정 정보 입력 및 생성
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.password.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('회원가입이 완료되었습니다! 로그인해주세요.');
        router.push('/login');
      } else {
        setError(data.error || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      console.error('회원가입 실패:', error);
      setError('회원가입에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="flex items-center justify-center px-6 py-20 min-h-screen">
        <div className="w-full max-w-xl bg-white rounded-lg shadow-lg p-10">
          {/* 제목 */}
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            계정 만들기
          </h2>
          <p className="text-center text-gray-600 text-sm mb-8">
            {step === 'email' && '이메일 주소를 입력해주세요'}
            {step === 'verify' && '이메일로 전송된 인증 코드를 입력해주세요'}
            {step === 'info' && '계정 정보를 입력해주세요'}
          </p>

          {/* 진행 표시 */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'email' ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'}`}>
                1
              </div>
              <div className="w-12 h-0.5 bg-gray-200"></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'verify' ? 'bg-black text-white' : step === 'info' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                2
              </div>
              <div className="w-12 h-0.5 bg-gray-200"></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'info' ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'}`}>
                3
              </div>
            </div>
          </div>

          {/* 메시지 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600 text-sm">{successMessage}</p>
            </div>
          )}

          {/* 1단계: 이메일 입력 */}
          {step === 'email' && (
            <form onSubmit={handleSendCode} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="minglz@gmail.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-gray-900"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSendingCode}
                className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSendingCode ? '전송 중...' : '인증 코드 전송'}
              </button>

              <div className="text-center">
                <span className="text-sm text-gray-600">이미 계정이 있으신가요? </span>
                <Link href="/login" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  로그인
                </Link>
              </div>
            </form>
          )}

          {/* 2단계: 인증 코드 입력 */}
          {step === 'verify' && (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div>
                <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
                  인증 코드
                </label>
                <input
                  id="verificationCode"
                  name="verificationCode"
                  type="text"
                  value={formData.verificationCode}
                  onChange={handleChange}
                  placeholder="6자리 숫자"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-gray-900 text-center text-2xl tracking-widest"
                  required
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {formData.email}로 전송된 6자리 코드를 입력하세요
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? '확인 중...' : '인증 확인'}
              </button>

              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full text-gray-600 py-2 text-sm hover:text-gray-900"
              >
                ← 이메일 다시 입력
              </button>
            </form>
          )}

          {/* 3단계: 계정 정보 입력 */}
          {step === 'info' && (
            <form onSubmit={handleSignup} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  회사명
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="(주)밍글즈"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-gray-900"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-gray-900 pr-12"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">최소 8자 이상</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호 확인
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-gray-900 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? '계정 생성 중...' : '계정 만들기'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
