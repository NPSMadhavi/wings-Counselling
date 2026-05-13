import { motion } from "framer-motion";
import { ArrowRight, BookOpen } from "lucide-react";

const articles = [
  {
    category: "Mental Health",
    title: "Understanding and Managing Anxiety in Daily Life",
    desc: "Practical strategies and insights for coping with modern stressors.",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=600&auto=format&fit=crop"
  },
  {
    category: "Relationship",
    title: "Building Stronger Communication with Your Partner",
    desc: "Essential tools for couples looking to deepen their connection.",
    image: "https://images.unsplash.com/photo-1516585427167-9f4af9627e6c?q=80&w=600&auto=format&fit=crop"
  },
  {
    category: "Parenting",
    title: "Navigating the Teenage Years: A Guide for Parents",
    desc: "How to maintain boundaries while fostering independence.",
    image: "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?q=80&w=600&auto=format&fit=crop"
  },
  {
    category: "Grief",
    title: "The Stages of Grief and Finding Your Way Forward",
    desc: "Understanding loss and the non-linear journey of healing.",
    image: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?q=80&w=600&auto=format&fit=crop"
  }
];

export function Articles() {
  return (
    <section id="articles" className="py-24 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h4 className="text-primary font-bold tracking-wider uppercase text-sm mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Resources
            </h4>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">Featured Articles</h2>
          </div>
          <button className="text-primary font-bold hover:text-primary/80 transition-colors flex items-center gap-2 group">
            View All Resources 
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {articles.map((article, index) => (
            <motion.article 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border group hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              <div className="h-48 overflow-hidden relative">
                <div className="absolute inset-0 bg-primary/20 group-hover:bg-transparent transition-colors z-10 duration-300"></div>
                {/* Unsplash abstract/mood images for articles */}
                <img 
                  src={article.image} 
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 z-20">
                  <span className="bg-white/90 backdrop-blur text-primary text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                    {article.category}
                  </span>
                </div>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="font-bold text-lg text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                  {article.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-6 line-clamp-2 flex-grow">
                  {article.desc}
                </p>
                <div className="mt-auto flex items-center text-primary text-sm font-bold group/btn cursor-pointer">
                  Read Article
                  <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
