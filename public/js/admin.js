// Tambahkan event listener untuk setiap dropdown
document.querySelectorAll(".dropdown-toggle").forEach((item) => {
  item.addEventListener("click", (event) => {
    // Ambil elemen dropdown-menu yang sesuai
    const dropdownMenu = item.nextElementSibling;

    // Toggle class 'show' untuk menampilkan/menyembunyikan dropdown-menu
    dropdownMenu.classList.toggle("show");

    // Tutup dropdown-menu jika user mengklik di luar dropdown
    window.addEventListener("click", function (e) {
      if (!item.contains(e.target)) {
        dropdownMenu.classList.remove("show");
      }
    });
  });
});

// Get all modal elements
var modals = document.querySelectorAll(".modal");

// Get all elements that open the modal
var btns = document.querySelectorAll(".open-modal");

// Get all elements that close the modal
var spans = document.querySelectorAll(".close");

// Function to open modal
function openModal(index, event) {
  modals[index].style.display = "block";
  event.preventDefault(); // Prevent default behavior
}

// Function to close modal
function closeModal(index) {
  modals[index].style.display = "none";
}

// Add click event listener to document
document.addEventListener("click", function(event) {
  // Check if clicked element is a button to open modal
  if (event.target.classList.contains("open-modal")) {
    // Get index of clicked button
    var index = Array.from(btns).indexOf(event.target);
    openModal(index, event); // Pass event parameter to openModal function
  }

  // Check if clicked element is a span to close modal
  if (event.target.classList.contains("close")) {
    // Get index of modal associated with clicked span
    var index = Array.from(spans).indexOf(event.target);
    closeModal(index);
  }

  // Check if clicked element is outside the modal to close it
  if (event.target.classList.contains("modal")) {
    // Get index of modal associated with clicked element
    var index = Array.from(modals).indexOf(event.target);
    closeModal(index);
  }
});

// Menangkap klik tombol edit
$(document).ready(function() {
  // Menangkap klik tombol edit
  $('.open-modal').click(function(event) {
    event.preventDefault(); // Menghentikan aksi default dari link
    var movieId = $(this).data('modal-id'); // Menggunakan data-modal-id
    
    // Mengambil data film berdasarkan ID dari backend (misalnya dengan AJAX)
    $.ajax({
      url: '/getmovie/' + movieId,
      type: 'GET',
      success: function(data) {
        console.log(data);
        // Memasukkan data film ke dalam input modal yang sesuai
        $('#myModal' + movieId + ' #name').val(data[0].name);
        $('#myModal' + movieId + ' #rating').val(data[0].rating);
        $('#myModal' + movieId + ' #genre').val(data[0].genre);
        $('#myModal' + movieId + ' #harga').val(data[0].harga);
        $('#myModal' + movieId + ' #poster').val(data[0].poster);
        $('#myModal' + movieId + ' #video').val(data[0].video);
        $('#myModal' + movieId + ' #quality').val(data[0].quality);
        $('#myModal' + movieId + ' #releasedate').val(data[0].releasedate);
        $('#myModal' + movieId + ' #duration').val(data[0].duration);
        $('#myModal' + movieId + ' #language').val(data[0].language);
        $('#myModal' + movieId + ' #description').val(data[0].description);
        $('#myModal' + movieId + ' #posterls').val(data[0].posterls);
        $('#myModal' + movieId + ' #ss1').val(data[0].ss1);
        $('#myModal' + movieId + ' #ss2').val(data[0].ss2);
        $('#myModal' + movieId + ' #ss3').val(data[0].ss3);
        $('#myModal' + movieId + ' #ss4').val(data[0].ss4);
        $('#myModal' + movieId + ' #seasons').val(data[0].seasons);
        
        // Menampilkan modal yang sesuai dengan ID film
        $('#myModal' + movieId).show();
      },
      error: function(err) {
        console.error('Error: ' + err);
      }
    });
  });
});


document.addEventListener('DOMContentLoaded', function() {
  const editButtons = document.querySelectorAll('.edit-movie');
  editButtons.forEach(button => {
    button.addEventListener('click', function(event) {
      event.preventDefault();
      const movieId = this.getAttribute('data-movie-id');
      openEditModal(movieId);
    });
  });

  function openEditModal(movieId) {
    // Di sini Anda dapat menambahkan logika untuk membuka modal edit dan mengisi formulir dengan data film yang ingin diedit
    console.log('Edit movie with ID:', movieId);
    // Contoh: Modifikasi atribut action formulir untuk mengarahkan ke endpoint yang tepat
    const form = document.getElementById('editForm');
    form.action = '/updatemovie/' + movieId;
  }
});


function deleteMovie(movieId) {
  if (confirm('Are you sure you want to delete this movie?')) {
    window.location.href = '/delete/' + movieId;
  }
}


