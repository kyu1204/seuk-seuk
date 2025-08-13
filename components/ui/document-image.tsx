'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface DocumentImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  containerClassName?: string;
  variant?: 'default' | 'preview' | 'full';
}

/**
 * 통일된 문서 이미지 컴포넌트
 * 모든 화면에서 일관된 이미지 크기와 스타일을 제공합니다.
 */
const DocumentImage = forwardRef<HTMLImageElement, DocumentImageProps>(
  ({ className, containerClassName, variant = 'default', ...props }, ref) => {
    // 이미지 크기 통일을 위한 고정 스타일
    const imageStyles = {
      // 모든 화면에서 동일한 최대 크기 설정
      maxWidth: '1200px',  // 고정 최대 너비
      maxHeight: '1600px', // 고정 최대 높이 (4:3 비율보다 세로가 긴 문서 고려)
      width: '100%',
      height: 'auto',
      aspectRatio: 'auto', // 원본 비율 유지
    };

    const variants = {
      default: {
        container: 'relative w-full flex justify-center',
        image: 'object-contain bg-white border border-gray-200 rounded-lg shadow-sm',
      },
      preview: {
        container: 'relative w-full flex justify-center bg-gray-50 p-4 rounded-lg',
        image: 'object-contain bg-white border border-gray-300 rounded shadow-lg',
      },
      full: {
        container: 'relative w-full flex justify-center',
        image: 'object-contain bg-white',
      },
    };

    const variantStyles = variants[variant];

    return (
      <div className={cn(variantStyles.container, containerClassName)}>
        <img
          ref={ref}
          className={cn(variantStyles.image, className)}
          style={imageStyles}
          draggable="false"
          {...props}
        />
      </div>
    );
  }
);

DocumentImage.displayName = 'DocumentImage';

export { DocumentImage };
export type { DocumentImageProps };
