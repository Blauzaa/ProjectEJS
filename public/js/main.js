let header = document.querySelector('header');
let menu = document.querySelector('#menu-icon');
let navbar = document.querySelector('.navbar');

//program untuk mengatur scrollbar
window.addEventListener('scroll', () => {
  header.classList.toggle('shadow', window.scrollY > 0);
});


//menu ketika ukuran layar kecil
menu.onclick = () => {
  menu.classList.toggle('bx-x');
  navbar.classList.toggle('active');
};

window.onscroll = () => {
  menu.classList.remove('bx-x');
  navbar.classList.remove('active');
}
  
//slider
var swiper = new Swiper(".home", {
    loop:true,
    spaceBetween: 30,
    centeredSlides: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
  });
  

  var swiper = new Swiper(".coming-container", {
    spaceBetween: 20,
    loop:true,
    autoplay: {
      delay: 55000,
      disableOnInteraction: false,
    },
    centeredSlides:true,
    breakpoints: {
      0: {
        slidesPerView: 2,
      },
      568: {
        slidesPerView: 3,
      },
      768: {
        slidesPerView: 4,
      },
      968: {
        slidesPerView: 5,
      },
    },
  });

  var swiper = new Swiper(".free-container", {
    spaceBetween: 20,
    loop:true,
    autoplay: {
      delay: 55000,
      disableOnInteraction: false,
    },
    centeredSlides:true,
    breakpoints: {
      0: {
        slidesPerView: 2,
      },
      568: {
        slidesPerView: 3,
      },
      768: {
        slidesPerView: 4,
      },
      968: {
        slidesPerView: 5,
      },
    },
  });


  //playvideo 
  document.addEventListener('DOMContentLoaded', function () {
    var videoElement = document.getElementById('m-video');
    var movieBanner = document.querySelector('.movie-banner');

    document.querySelector('.play-btn a').addEventListener('click', function () {
        videoElement.play();
        document.querySelector('.play').classList.add('active-popup');
        
        movieBanner.style.zIndex = 1;
    });

    document.querySelector('.close-movie').addEventListener('click', function () {
        videoElement.pause();
        videoElement.currentTime = 0;
        document.querySelector('.play').classList.remove('active-popup');
        

        movieBanner.style.zIndex = 0;
    });
});

//dropdown
function toggleDropdown(dropdownId) {
  var dropdown = document.getElementById(dropdownId);
  dropdown.style.display = (dropdown.style.display === "block") ? "none" : "block";
}







