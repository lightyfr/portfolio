import { Mail, User, Zap } from "lucide-react";
import {
  asanaIcon,
  athonLogo,
  client_1,
  client_2,
  client_3,
  client_4,
  discord,
  dribble,
  dribbleIcon,
  facebook,
  figmaIcon,
  framerIcon,
  graphicDesignIcon,
  instagramIcon,
  linkedInIcon,
  notionIcon,
  pinterest,
  pixelworksLogo,
  project_1,
  project_2,
  project_3,
  project_4,
  seoOptIcon,
  slackIcon,
  snapchat,
  spotify,
  vortexLogo,
  webDesignIcon,
  webDevIcon,
  webflowIcon,
  XLogo,
} from "@/app/assets/assets";
import { Github, MailIcon, Linkedin } from 'lucide-react'

import { counterListsType, FAQ, FollowerData, myExperienceTypes, myServicesPlansTypes, myServicesTypes, myShowCasesTypes, myStackTypes, socialBrandsTypes, testimonialsTypes } from "@/types";
import { socialListsTypes } from '@/types'
import { pagesListsType } from "@/types";

export const pagesLists: pagesListsType[] = [
  {
    id: 1,
    title: "Home",
    href: "/",
    icon: <User />,
  },
  {
    id: 2,
    title: "Services",
    href: "/services",
    icon: <Zap />,
  },
  {
    id: 3,
    title: "Contact",
    href: "/contact",
    icon: <Mail />,
  },
];

export const socialLists: socialListsTypes[] = [
  {
    id: 1,
    title: 'LinkedIn',
    icon: <Linkedin size={22} />,
    link: 'https://www.linkedin.com/in/adhitya-nadooli-8b83782b4/'
  },
  {
    id: 2,
    title: 'Github',
    icon: <Github size={22} />,
    link: 'https://www.github.com/lightyfr'
  },
  {
    id: 3,
    title: 'Email',
    icon: <MailIcon size={22} />,
    link: "mailto:adhi.naddi@gmail.com"
  }
]

export const socialBrands: socialBrandsTypes[] = [
  {
    id: 1,
    name: "Discord",
    icon: discord,
    link: "https://discord.com",
  },
  {
    id: 2,
    name: "Dribbble",
    icon: dribble,
    link: "https://dribbble.com",
  },
  {
    id: 3,
    name: "Facebook",
    icon: facebook,
    link: "https://facebook.com",
  },
  {
    id: 4,
    name: "Pinterest",
    icon: pinterest,
    link: "https://pinterest.com",
  },
  {
    id: 5,
    name: "SnapChat",
    icon: snapchat,
    link: "https://snapchat.com",
  },
  {
    id: 6,
    name: "Spotify",
    icon: spotify,
    link: "https://open.spotify.com",
  },
];


import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: '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',
});

async function fetchGitHubData() {
  try {
    let repos;

    try {
      repos = await octokit.repos.listForAuthenticatedUser({
        visibility: 'all',
      });
    } catch (error) {
      console.error('Error fetching GitHub data:', error);
    }

    let totalCommits = 0;



    for (const repo of repos.data) {
      console.log(`Fetching commits for repo: ${repo.name}`);
      try {
        const { data: commits } = await octokit.repos.listCommits({
          owner: "lightyfr",
          repo: repo.name,

          per_page: 100,
        });
        totalCommits += commits.length;
      } catch (commitError) {
        console.error(`Error fetching commits for repo: ${repo.name}`, commitError);
      }
    }

    const { data: user } = await octokit.users.getAuthenticated();

    return {
      commitsThisYear: totalCommits,
      yearsOfExperience: new Date().getFullYear() - new Date(user.created_at).getFullYear(),
      completedProjects: repos.data.length,
      awardsReceived: 6, // This would need to be manually updated or fetched from another source
    };
  } catch (error) {
    console.error("Error fetching GitHub data:", error);
    return {
      commitsThisYear: 0,
      yearsOfExperience: 0,
      completedProjects: 0,
      awardsReceived: 0,
    };
  }
}

const githubData = await fetchGitHubData();

export const counterLists: counterListsType[] = [
  {
    id: 1,
    title: "Commits This Year",
    value: githubData.commitsThisYear,
  },
  {
    id: 2,
    title: "Years of Experience",
    value: githubData.yearsOfExperience,
  },
  {
    id: 3,
    title: "Completed Projects",
    value: githubData.completedProjects,
  },
  {
    id: 4,
    title: "Awards Received",
    value: githubData.awardsReceived,
  },
];

export const myExperience: myExperienceTypes[] = [
  {
    id: 1,
    year: "2024 - Present",
    title: "Founder / CEO",
    company: "Dusk IDE",
    label: 'Tech Startup',
    description: "Developing an AI-powered code editor for developers to enhance code quality, fully integrated with advanced AI features and built off a fork of VS Code.",
    link: "duskeditor.com",
    logo: vortexLogo
  },
  {
    id: 2,
    year: "2024 - Present",
    title: "Founder",
    company: "Pyupil",
    label: 'Education Initiative',
    description: "Built a student productivity tool to help students manage their time and tasks, featuring a calendar, dashboard, and Pyupil AI integration.",
    link: "pyupil.me",
    logo: pixelworksLogo
  },
  {
    id: 3,
    year: "2024 - Present",
    title: "Developer",
    company: "Yaaro",
    label: 'Social Networking App',
    description: "Collaborating with an international team to develop a mobile app aimed at fostering connectivity and building friendships in urban areas.",
    link: "yaaroapp.com",
    logo: figmaIcon
  },
  {
    id: 4,
    year: "2023 - 2023",
    title: "Intern",
    company: "Cita",
    label: 'Reservation Marketplace',
    description: "Learned UI/UX design with modern technologies like React, Next.js, AWS, and Figma. Contributed to the Cita website’s design and development.",
    link: "citamarketplace.com",
    logo: athonLogo
  }
];

export const myStack: myStackTypes[] = [
  {
    id: 1,
    title: "React Native",
    description: "Cross-Platform Mobile Development",
    logo: figmaIcon,
    link: "https://reactnative.dev",
  },
  {
    id: 2,
    title: "Next.js",
    description: "Modern Web Development Framework",
    logo: figmaIcon,
    link: "https://nextjs.org",
  },
  {
    id: 3,
    title: "Supabase",
    description: "Open-Source Backend-as-a-Service",
    logo: figmaIcon,
    link: "https://supabase.io",
  },
  {
    id: 4,
    title: "Electron",
    description: "Framework for Building Cross-Platform Desktop Apps",
    logo: figmaIcon,
    link: "https://www.electronjs.org",
  },
  {
    id: 5,
    title: "Figma",
    description: "Interface Design Tool",
    logo: figmaIcon,
    link: "https://www.figma.com",
  },
  {
    id: 6,
    title: "AWS",
    description: "Cloud Computing Services",
    logo: figmaIcon,
    link: "https://aws.amazon.com",
  }
];

export const myServices: myServicesTypes[] = [
  {
    id: 1,
    title: 'App Development',
    description: 'Building modern, responsive mobile apps that deliver exceptional user experiences.',
    icon: figmaIcon,
    link: 'http://localhost:3000/services'
  },
  {
    id: 2,
    title: 'Web Development',
    description: 'Creating scalable and performant web applications with the latest technologies.',
    icon: webDevIcon,
    link: 'http://localhost:3000/services'
  },
  {
    id: 3,
    title: 'UI/UX Design',
    description: 'Crafting user-friendly interfaces and experiences that elevate digital products.',
    icon: figmaIcon,
    link: 'http://localhost:3000/services'
  },
  {
    id: 4,
    title: 'AI Integration',
    description: 'Implementing AI-driven solutions for smarter, more efficient applications.',
    icon: figmaIcon,
    link: 'http://localhost:3000/services'
  }
];

export const myShowCases: myShowCasesTypes[] = [
  {
    id: 1,
    title: 'Dusk IDE',
    description: 'An AI-powered code editor designed for developers to write better code, integrating advanced AI models for intelligent code assistance.',
    link: 'duskeditor.com',
    type: 'Tech',
    theme: 'Dark',
    pages: 4,
    image: project_1,
  },
  {
    id: 2,
    title: 'Yaaro App',
    description: 'A mobile app aimed at fostering social connections and building friendships in urban settings.',
    link: 'yaaroapp.com',
    type: 'Social',
    theme: 'Light',
    pages: 5,
    image: project_2,
  },
  {
    id: 3,
    title: 'Pyupil',
    description: 'A student productivity tool designed to help students stay organized and on top of their academic and personal tasks.',
    link: 'pyupil.me',
    type: 'Education',
    theme: 'Dark',
    pages: 6,
    image: project_3,
  },
  {
    id: 4,
    title: 'Cita Marketplace',
    description: 'A reservation marketplace that connects customers with service providers, designed to streamline booking processes.',
    link: 'citamarketplace.com',
    type: 'Business',
    theme: 'Light',
    pages: 6,
    image: project_4,
  }
];


export const testimonials: testimonialsTypes[] = [
  {
    id: 1,
    name: 'Sarah Thompson',
    description: 'I am thrilled with the website for my business. His ability to translate my vision into a visually stunning...',
    location: 'New York City, USA.',
    avatar: client_1,
  },
  {
    id: 2,
    name: 'John Anderson',
    description: 'Working with Pragadesh was a game-changer for my online business. His web design skills are exceptional.',
    location: 'Sydney, Australia.',
    avatar: client_2,
  },
  {
    id: 3,
    name: 'Mark Davis',
    description: 'Pragadesh’s creativity and technical expertise transformed our website into a visually stunning platform.',
    location: 'London, UK.',
    avatar: client_3,
  },
  {
    id: 4,
    name: 'Laura Adams',
    description: 'Pragadesh is a artist when it comes to website. He transformed my outdated website into a modern masterpiece.',
    location: 'Madrid, Spain.',
    avatar: client_4,
  }
]

export const myServicesPlans: myServicesPlansTypes[] = [
  {
    id: 1,
    service: 'Web Design',
    price: '$50',
    description: 'Crafting visually captivating and user-friendly websites for online success.',
    completedWorks: '25+',
    experience: '5+',
    totalHoursWorked: '500 hours',
    icon: webDesignIcon,
  },
  {
    id: 2,
    service: 'Web Dev',
    price: '$60',
    description: 'Bringing ideas to life with robust and scalable web solutions.',
    completedWorks: '30+',
    experience: '6+',
    totalHoursWorked: '420 hours',
    icon: webDevIcon,
  },
  {
    id: 3,
    service: 'Graphic Design',
    price: '$40',
    description: 'Creating visually stunning designs that captivate and engage audiences.',
    completedWorks: '40+',
    experience: '8+',
    totalHoursWorked: '328 hours',
    icon: graphicDesignIcon,
  },
  {
    id: 4,
    service: 'SEO',
    price: '$70',
    description: 'Elevating online visibility and driving organic traffic through strategies.',
    completedWorks: '20+',
    experience: '4+',
    totalHoursWorked: '223 hours',
    icon: seoOptIcon,
  }
];

export const faqData: FAQ[] = [
  {
    question: "Can you work with clients remotely?",
    answer: "Absolutely! I have experience working with clients from all around the world. Through effective communication channels such as email, video calls, and project management tools, I ensure seamless collaboration regardless of geographical location.",
  },
  {
    question: "Will my website be mobile-friendly?",
    answer: "Absolutely! Mobile responsiveness is a top priority in today's digital landscape. I design and develop websites that are fully responsive and adaptable to various devices and screen sizes. Your website will provide an optimal user experience whether accessed via desktops, smartphones, or tablets.",
  },
  {
    question: "How long does it typically take to complete a project?",
    answer: "The timeline for each project varies depending on its scope and complexity. Factors such as the number of pages, functionalities, and the client feedback process can impact the timeline. Upon discussing your project requirements, I will provide you with a realistic timeline and keep you updated throughout the process.",
  },
  {
    question: "Can you integrate third-party tools into my website?",
    answer: "Yes, I have experience integrating various third-party tools, plugins, and platforms into websites. Whether you need to integrate e-commerce functionalities, social media integration, email marketing services, or anything else, I can recommend and help ensure smooth integration.",
  },
  {
    question: "Do you offer website maintenance?",
    answer: "Yes, I offer website maintenance services to ensure your website remains up to date, secure, and optimized. From performance updates to adding new features and content, I can provide ongoing support to keep your website running smoothly.",
  },
  {
    question: "How do you handle website revisions?",
    answer: "I value your input and collaboration throughout the design process. Upon completing an initial design, I encourage you to provide feedback. I incorporate your suggestions and revisions to ensure the final product aligns with your vision.",
  },
  {
    question: "Can you optimize my website?",
    answer: "Certainly! I incorporate search engine optimization (SEO) best practices into my development process. This includes using relevant keywords, optimizing meta tags, creating search-engine-friendly URLs, and ensuring your website has a solid foundation for better search engine visibility.",
  },
  {
    question: "What are your payment terms?",
    answer: "Payment terms may vary depending on the project scope and duration. Generally, I request an initial deposit before commencing work.",
  },
];

export const followerData: FollowerData[] = [
  {
    platform: "twitter",
    followers: "12.6K",
    url: "https://twitter.com/",
    icon: XLogo,
  },
  {
    platform: "Instagram",
    followers: "8.3K",
    url: "https://www.instagram.com/",
    icon: instagramIcon,
  },
  {
    platform: "LinkedIn",
    followers: "2.5K",
    url: "https://www.linkedin.com/",
    icon: linkedInIcon,
  },
  {
    platform: "Dribbble",
    followers: "3.2K",
    url: "https://dribbble.com/",
    icon: dribbleIcon,
  },
];