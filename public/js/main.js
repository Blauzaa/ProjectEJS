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
  
// Inisialisasi slider untuk halaman utama
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
  
// Inisialisasi slider untuk daftar film comingsoon
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
// Inisialisasi slider untuk daftar film freemovie
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


    // Menangani pemutaran video saat tombol play ditekan
  document.addEventListener('DOMContentLoaded', function () {
    var videoElement = document.getElementById('m-video');
    var movieBanner = document.querySelector('.movie-banner');
    // Mengaktifkan pemutaran video dan menampilkan popup pemutaran
    document.querySelector('.play-btn a').addEventListener('click', function () {
        videoElement.play();
        document.querySelector('.play').classList.add('active-popup');
        
        movieBanner.style.zIndex = 1;
    });
      // Menghentikan pemutaran video dan menutup popup pemutaran
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

//untuk search 
document.addEventListener('DOMContentLoaded', function() {
  const searchContainer = document.querySelector('.search-container');
  const searchResults = document.querySelector('.search_results');

  // Function to hide search results
  function hideSearchResults() {
      searchResults.style.display = 'none';
  }

  // Event listener to hide search results when clicking outside the container
  document.addEventListener('click', function(event) {
      const isClickInsideSearchContainer = searchContainer.contains(event.target);
      if (!isClickInsideSearchContainer) {
          hideSearchResults();
      }
  });

  // Event listener to prevent hiding search results when clicking inside the results container
  searchResults.addEventListener('click', function(event) {
      event.stopPropagation();
  });
});





