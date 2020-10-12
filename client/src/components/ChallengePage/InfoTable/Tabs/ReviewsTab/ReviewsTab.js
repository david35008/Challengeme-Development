import React from "react";
import { useEffect, useState } from "react";
import Review from "./Review";
import network from "../../../../../services/network";
const challengeId = 2;
function ReviewsTab({ challengeId }) {
  const [reviews, setReviews] = useState(null);
  useEffect(() => {
    const fetchReviews = async () => {
      debugger
      const { data: reviewsArrayFromServer } = await network.get(
        `/api/v1/reviews/byChallenge/${challengeId}`
      );
      debugger;
      const reviewsWithContent = reviewsArrayFromServer.filter(
        (review) => review.title && review.content
      );
      setReviews(reviewsWithContent);

    };
    fetchReviews();
    const liveReviews = setInterval(fetchReviews, 5000);
    return () => clearInterval(liveReviews);
  }, [challengeId]);
  return reviews ? (
    reviews.map((review, index) => {
      const {
        createdAt,
        title,
        content,
        rating,
        User: { userName },
      } = review;
      return (
        <Review
          author={userName}
          createdAt={createdAt}
          title={title}
          content={content}
          rating={rating}
        />
      );
    })
  ) : (
    <h1>Loading....</h1>
  );
}

export default ReviewsTab;