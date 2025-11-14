import React from "react";
import { Twitter, Instagram, Facebook } from "lucide-react";

const Footer = () => (
  <footer className="bg-white border-t border-gray-200 shadow-sm px-6 py-8 mt-12">
    <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="mb-2 md:mb-0 flex items-center gap-2">
        <div className="p-2 bg-blue-100 rounded-lg">
          <span className="text-blue-600 text-lg font-bold">?</span>
        </div>
        <span className="font-bold text-lg text-gray-800">QuizMaster</span> &copy; {new Date().getFullYear()}
      </div>
      <div className="flex flex-col md:flex-row gap-8">
        {/* Quick Links */}
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Quick Links</h4>
          <div className="flex flex-col gap-1 text-sm text-gray-600">
            <a href="/" className="hover:text-blue-600 transition">Home</a>
            <a href="/quizzes" className="hover:text-blue-600 transition">Quizzes</a>
            <a href="/leaderboard" className="hover:text-blue-600 transition">Leaderboard</a>
            <a href="/profile" className="hover:text-blue-600 transition">Profile</a>
          </div>
        </div>
        {/* Contact Us */}
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Contact Us</h4>
          <div className="flex flex-col gap-1 text-sm text-gray-600">
            <a href="mailto:support@quizmaster.com" className="hover:text-blue-600 transition">mail.quizmasterai@gmail.com</a>
            <span>+91 77369 86418</span>
            <span>ICT academy of Kerala,Thiruvananthapuram Kerala, India</span>
          </div>
        </div>
        {/* Socials */}
        
      </div>
      <div className="text-xs text-gray-400 mt-4 md:mt-0 text-center w-full md:w-auto">
        Made with <span className="text-red-500">♥</span> by
        <span>
          <br></br>
          Roshan Wilson
          <br></br>
          Aleena CB
          <br></br>
          Gokul Dev D S
        </span>
      </div>
    </div>
  </footer>
);

export default Footer;
