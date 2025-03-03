import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDate } from '../common/date';

const BlogPostCard = ({ blog, variant = 'default' }) => {
  const {
    blog_id,
    title,
    banner,
    content,
    tags,
    author,
    publishedAt,
    activity = { total_reads: 0, total_likes: 0, total_comments: 0 }
  } = blog;

  const variants = {
    default: 'w-full',
    trending: 'w-full',
    compact: 'w-full flex gap-4',
    related: 'w-full'
  };

  const imageVariants = {
    default: 'aspect-[16/9]',
    trending: 'aspect-[16/9]',
    compact: 'w-24 h-24',
    related: 'aspect-[16/9]'
  };

  const navigate = useNavigate();

  const handleTagClick = (tag, e) => {
    e.preventDefault(); // Prevent event bubbling to parent Link
    e.stopPropagation(); // Prevent event bubbling to parent Link
    
    // Use consistent URL format with query parameters
    navigate(`/search?tag=${encodeURIComponent(tag)}`);
  };

  // Extract text content from the content array
  const getTextContent = () => {
    if (!content || content.length === 0) return '';
    
    // If content is an array of content blocks
    if (Array.isArray(content)) {
      // Look for paragraph type blocks and extract their text
      const paragraphBlocks = content.filter(block => block.type === 'paragraph');
      if (paragraphBlocks.length > 0) {
        return paragraphBlocks.map(block => block.data?.text || '').join(' ').slice(0, 150) + '...';
      }
      return '';
    }
    
    // If content is a string (for backward compatibility)
    if (typeof content === 'string') {
      return content.slice(0, 150) + '...';
    }
    
    return '';
  };

  return (
    <article className={`bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow ${variants[variant]}`}>
      {banner && (
        <Link to={`/blog/${blog_id}`} className={`block relative ${imageVariants[variant]} overflow-hidden`}>
          <img 
            src={banner}
            alt={title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
          {variant === 'trending' && (
            <span className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
              Trending
            </span>
          )}
        </Link>
      )}

      <div className={`p-4 ${variant === 'compact' ? 'flex-1' : ''}`}>
        <div className="flex items-center gap-3 mb-3">
          <Link to={`/user/${author.personal_info?.username}`} className="flex items-center gap-2">
            <img 
              src={author.personal_info?.profile_img}
              alt={author.personal_info?.fullname}
              className="w-6 h-6 rounded-full"
            />
            <span className="text-gray-700 text-sm font-medium">
              {author.personal_info?.fullname}
            </span>
          </Link>
          <span className="text-gray-500 text-sm">•</span>
          <time className="text-gray-500 text-sm">{formatDate(publishedAt)}</time>
        </div>

        <Link to={`/blog/${blog_id}`} className="block group">
          <h2 className={`font-bold group-hover:text-blue-600 line-clamp-2 ${
            variant === 'compact' ? 'text-base' : 'text-xl mb-2'
          }`}>
            {title}
          </h2>
          {variant !== 'compact' && (
            <p className="text-gray-600 line-clamp-2 mb-4 text-sm">
              {getTextContent()}
            </p>
          )}
        </Link>

        {variant !== 'compact' && tags && Array.isArray(tags) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.slice(0, 3).map((tag, index) => (
              <button 
                key={index} 
                className="tag text-sm bg-gray-100 px-3 py-1 rounded-full text-gray-600 hover:bg-gray-200 cursor-pointer"
                onClick={(e) => handleTagClick(tag, e)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 text-gray-500 text-sm">
          <span className="flex items-center gap-1">
            <i className="fi fi-rr-eye"></i>
            {activity.total_reads}
          </span>
          <span className="flex items-center gap-1">
            <i className="fi fi-rr-heart"></i>
            {activity.total_likes}
          </span>
          {variant !== 'compact' && (
            <span className="flex items-center gap-1">
              <i className="fi fi-rr-comment"></i>
              {activity.total_comments}
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

export default BlogPostCard;