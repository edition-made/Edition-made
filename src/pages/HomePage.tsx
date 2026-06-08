import Hero from '../components/home/Hero';
import PromoSection from '../components/home/PromoSection';
import NewArrivals from '../components/home/NewArrivals';
import CategoriesSection from '../components/home/CategoriesSection';
import PaymentSection from '../components/home/PaymentSection';
import ReviewsSection from '../components/home/ReviewsSection';
import ShowroomSection from '../components/home/ShowroomSection';
import WhyUs from '../components/home/WhyUs';
import BlogPreview from '../components/home/BlogPreview';
import HomeFAQ from '../components/home/HomeFAQ';

export default function HomePage() {
  return (
    <>
      <Hero />
      <PaymentSection />
      <PromoSection />
      <NewArrivals />
      <CategoriesSection />
      <WhyUs />
      <ShowroomSection />
      <ReviewsSection />
      <BlogPreview />
      <HomeFAQ />
    </>
  );
}
