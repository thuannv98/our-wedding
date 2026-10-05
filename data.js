/* Everything the invitation says. This is the only file to edit.
 *
 * Names are what they look like: `album` is the album, `groom.photo` is his picture.
 * A value appears once; if two places on the page show the same thing, they both read
 * this one key.
 *
 * Leave a parent's name empty and that line disappears from the page.
 * Change a ceremony date and its weekday, its lunar date and the calendar all follow.
 * `form.endpoint` empty means the forms only remember answers in the guest's browser.
 */
window.WEDDING = {
  "pageTitle": "Happy Wedding - Văn Thuận & Thanh Thùy",
  "cover": {
    "photo": "img/6E7A0968.jpg",
    "kicker": "Save The Date",
    "photoMobile": "img/6E7A0968-m.jpg"
  },
  "story": {
    "cover": "img/huynh-truong.jpg",
    "photos": [
      "img/b079.jpg",
      "img/6E7A1013.jpg",
      "img/6E7A0744.jpg",
      "img/6E7A0770.jpg"
    ]
  },
  "doorPhoto": "img/b017.jpg",
  "doorPhotoMobile": "img/b014.jpg",
  "groom": {
    "name": "Văn Thuận",
    "saintName": "Đaminh Văn Thuận",
    "father": "",
    "mother": "Maria Ngô Thị Lan",
    "home": "Xã Phú Xuân, Tỉnh Đăk Lăk",
    "photo": "img/psd-phong-trang.jpg",
    "intro": "• Giới thiệu: Coder chính hiệu, dành cả thanh xuân để debug hệ thống.\n• Đặc điểm nhận dạng: Ưa chuộng mọi thứ có logic rõ ràng. Pin tụt cực nhanh nếu bị buộc phải hướng ngoại. Khi pin yếu, tự động kích hoạt chế độ \"trốn vào góc riêng\" để sạc lại năng lượng.\n• Kỹ năng đặc biệt: Tìm ra lỗi hệ thống siêu nhanh. Riêng vấn đề của cánh đối diện thì chắc cần dành cả đời để phân tích và hiểu.\n• Kinh nghiệm: Xây dựng thành công mối quan hệ trong suốt 3 năm qua. Hệ thống hoạt động mượt mà sau rất nhiều lần sửa lỗi (và sửa sai) cùng nhau và chuẩn bị phát hành bản chính thức.\n• Chỉ số nguy hiểm: 0%. Cực kỳ lành tính, dễ nuôi, chỉ cần cho ăn đầy đủ và cấp đủ Wi-Fi là được.\n• Trạng thái hiện tại: Status code: 200 OK (Đã kết nối thành công và trọn đời với ThuyThanh).",
    "quote": "Mỗi ngày thức dậy bạn nghĩ đến một ai đó, trước khi đi ngủ bạn nghĩ đến một ai đó. Đó là một ngày trọn vẹn.",
    "portrait": [
      "img/psd-phong-trang.jpg",
      "img/6E7A1333.jpg",
      "img/6E7A1461.jpg",
      "img/6E7A0935.jpg",
      "img/6E7A1307.jpg",
      "img/6E7A1125.jpg",
      "img/6E7A1013.jpg",
      "img/6E7A0770.jpg",
      "img/6E7A0744.jpg"
    ]
  },
  "bride": {
    "name": "Thanh Thuỳ",
    "saintName": "Maria Thanh Thuỳ",
    "father": "Simon Nguyễn Văn Thành",
    "mother": "Maria Phạm Thị Mơ",
    "home": "Xã Quảng Sơn, Tỉnh Lâm Đồng",
    "photo": "img/6E7A1333.jpg",
    "intro": "• Giới thiệu: Sỏi tiếng Trung chính hiệu, sở hữu kho từ vựng phong phú, có thể dịch mọi văn bản phức tạp\n• Đặc điểm nhận dạng: Đam mê phim cổ trang, yêu thích vẻ đẹp của những nét chữ và các thanh điệu nhẹ nhàng. Dung lượng pin sinh học: Tràn trề năng lượng, là trạm sạc không dây di động giúp anh đối diện nạp lại pin ngay lập tức.\n• Kỹ năng đặc biệt: Bắn tiếng Trung như gió, nói câu nào ngọt ngào câu đấy. Có năng lực hóa giải mọi logic bằng ánh mắt.\n• Kinh nghiệm vận hành: 3 năm làm quản lý độc quyền. Luôn biết cách chốt mọi hợp đồng.\n• Chỉ số quyền lực: 99.9%. Nắm giữ \"master key\".\n• Trạng thái hiện tại: Đã ký duyệt bản hợp đồng hiệu lực mãi mãi với VanThuan.",
    "quote": "Cái gọi là duyên phận, chính là trong ngàn vạn người gặp được người cần gặp, không sớm một bước cũng không muộn một bước.",
    "portrait": [
      "img/6E7A1333.jpg",
      "img/6E7A1461.jpg",
      "img/psd-phong-trang.jpg",
      "img/6E7A0935.jpg",
      "img/6E7A1125.jpg",
      "img/6E7A1307.jpg",
      "img/6E7A1013.jpg",
      "img/6E7A0770.jpg",
      "img/6E7A0744.jpg"
    ]
  },
  "coupleBackdrop": "",
  "ceremonies": [
    {
      "key": "mass",
      "title": "Thánh lễ Hôn phối",
      "time": "05:00",
      "date": "2026-10-23",
      "venue": "Giáo điểm An Phước, Giáo phận Ban Mê Thuột",
      "address": "Xã Quãng Sơn, Tỉnh Lâm Đồng",
      "map": "https://maps.app.goo.gl/W2VfEaqh4KzxN4De9",
      "photo": "img/hon-phoi.jpg"
    },
    {
      "key": "brideParty",
      "title": "Tiệc Cưới Nhà Gái",
      "time": "11:00",
      "date": "2026-10-23",
      "venue": "Tư gia nhà Gái",
      "address": "Xã Quảng Sơn, Tỉnh Lâm Đồng",
      "map": "https://maps.app.goo.gl/HTNRbQBjh2NW2HZRA",
      "photo": "img/v006.jpg"
    },
    {
      "key": "groomParty",
      "title": "Tiệc Cưới Nhà Trai",
      "time": "11:00",
      "date": "2026-10-25",
      "venue": "Tư gia nhà Trai",
      "address": "Xã Phú Xuân, Tỉnh Đăk Lăk",
      "map": "https://maps.app.goo.gl/C5itcA5evgdDsJNbA",
      "photo": "img/v005.jpg"
    }
  ],
  "weddingDate": "2026-10-23",
  "album": [
    "img/6E7A0968-m.jpg",
    "img/6E7A1307.jpg",
    "img/6E7A1125.jpg",
    "img/6E7A1421.jpg",
    "img/6E7A1461.jpg",
    "img/psd-phong-trang.jpg",
    "img/6E7A0744.jpg",
    "img/6E7A1033.jpg",
    "img/6E7A1013.jpg",
    "img/6E7A1115.jpg",
    "img/6E7A1232.jpg",
    "img/b079.jpg",
    "img/6E7A1363.jpg"
  ],
  "text": {
    "openInvite": "Chạm để mở thiệp",
    "saveTheDate": "Save The Date",
    "ourStory": "Một ngày thu, anh chàng Dev vô tư dùng chút kiến thức IT giúp đỡ cô sinh viên Thùy Thanh. Sợi dây duyên số bắt đầu, đưa anh trở thành tân Dự trưởng ngay trước thềm Trung Thu.\nNhững ngày cùng phục vụ, gói quà, làm lồng đèn đoạt giải đã nhen nhóm cho một tình yêu kỳ lạ. Dù đội mưa hứng nắng, hai đứa vẫn cứ cười vô tư.\nHơn 3 năm qua đi với đủ vui buồn, mâu thuẫn và thấu hiểu. Hai đứa Dự trưởng ngày nào giờ đã là Huynh trưởng. Mùa trung thu năm nay, chúng mình chính thức về một nhà, sẵn sàng cùng người thương xây dựng tổ ấm nhỏ.",
    "invitation": "Đến hiệp dâng Thánh lễ Hôn phối và tham dự buổi tiệc chung vui cùng gia đình chúng mình",
    "foreword": "Bữa tiệc được nâng niu, chỉn chu từng chi tiết đang chờ bạn đến tận hưởng khoảnh khắc thiêng liêng nhất trong cuộc đời chúng mình. Sẽ trọn vẹn hơn khi bạn cùng chúng mình ghi lại ký ức vô giá này.",
    "rsvpLead": "Sự có mặt của bạn là niềm vui lớn đối với chúng mình. Vui lòng xác nhận để buổi tiệc được chuẩn bị thật chỉn chu nhé!"
  },
  "wishRelations": [
    "Bạn của cô dâu",
    "Bạn của chú rể",
    "Bạn của cả hai",
    "Người thân",
    "Đồng nghiệp"
  ],
  "wishSuggestions": [
    "Chúc hai bạn mãi mãi hạnh phúc bên nhau ❤️💍",
    "Happy Wedding 🎉🎊 Chúc hai bạn trăm năm viên mãn, sớm có 1 thiên thần nha! 👶✨",
    "Trăm năm tình viên mãn 💕, bạc đầu nghĩa phu thê! Chúc hai bạn hạnh phúc mãi mãi!",
    "Chúc mừng hai bạn bước sang một trang mới 📖. Chúc tình yêu của hai bạn luôn bền chặt như ngày đầu! 💑",
    "Mong hai bạn sẽ luôn yêu thương, tôn trọng nhau 🥰. Hãy cùng nhau xây dựng một tổ ấm đầy ắp tiếng cười nhé! 🏡💕",
    "Chúc hai bạn có một cuộc sống hôn nhân tràn đầy niềm vui 😍, luôn bên nhau vượt qua mọi sóng gió! 🌊🤝",
    "Chúc hai bạn có một tình yêu đẹp như cổ tích 📖✨ và một cuộc sống hôn nhân như mơ! 🏰💖",
    "Hôm nay là ngày đặc biệt của hai bạn 🎊. Chúc hai bạn một chặng đường dài đầy yêu thương và hạnh phúc! ❤️",
    "Chúc hai bạn mãi mãi là tri kỷ, là chỗ dựa của nhau trong mọi khoảnh khắc cuộc đời! 👫💞",
    "Một chương mới đã mở ra 📖💏. Chúc hai bạn một cuộc sống hôn nhân ngập tràn yêu thương và niềm vui! 🎊",
    "Từ hôm nay, hai bạn không chỉ là một đôi uyên ương mà còn là gia đình của nhau! 👩‍❤️‍👨💖 Chúc hai bạn mãi hạnh phúc!",
    "Chúc hai bạn có một cuộc sống hôn nhân viên mãn, cùng nhau vượt qua mọi thử thách và luôn trân trọng nhau! 💑✨"
  ],
  "thanksPhoto": "img/6E7A0935.jpg",
  "rsvpPhoto": "img/psd-phong-trang.jpg",
  "form": {
    "endpoint": "https://script.google.com/macros/s/AKfycbwva6Q3biyfcV4cw8eKC5gb-zyWpqIZWM_fJaGD98MgKkAd6CwXL23aItEl_tq6JjpAfw/exec",
    "secret": "2310vanthuanthanhthuy"
  }
};
