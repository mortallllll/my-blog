import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, getAuthCookieName, getAuthToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password || !verifyPassword(password)) {
      return NextResponse.json(
        { error: '密码错误' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set(getAuthCookieName(), getAuthToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: '请求格式错误' },
      { status: 400 }
    );
  }
}
