export interface SecuritiesRec {
  symbol: string;
  companyName: string;
  securitiesFirm: string;
  sector: string;
  recommendation: "MUA" | "BÁN" | "THEO DÕI";
  currentPrice: number;
  targetBuyPrice: string; // e.g., "31.5 - 32.3" or "Không khuyến nghị"
  targetSellPrice: number; // target price in thousands
  updatedDate: string;
}

export const SECURITIES_DATA: SecuritiesRec[] = [
  // Ngân hàng
  {
    symbol: "TCB",
    companyName: "Ngân hàng TMCP Kỹ thương Việt Nam",
    securitiesFirm: "Chứng khoán SSI",
    sector: "Ngân hàng",
    recommendation: "MUA",
    currentPrice: 31.5,
    targetBuyPrice: "31.5 - 32.3",
    targetSellPrice: 35.9,
    updatedDate: "12/08/2026",
  },
  {
    symbol: "ACB",
    companyName: "Ngân hàng TMCP Á Châu",
    securitiesFirm: "Chứng khoán Vietcap",
    sector: "Ngân hàng",
    recommendation: "MUA",
    currentPrice: 22.75,
    targetBuyPrice: "22.8 - 23.3",
    targetSellPrice: 25.8,
    updatedDate: "12/08/2026",
  },
  {
    symbol: "STB",
    companyName: "Ngân hàng TMCP Sài Gòn Thương Tín",
    securitiesFirm: "Chứng khoán VNDIRECT",
    sector: "Ngân hàng",
    recommendation: "MUA",
    currentPrice: 74.1,
    targetBuyPrice: "74.1 - 76.0",
    targetSellPrice: 84.5,
    updatedDate: "12/08/2026",
  },
  {
    symbol: "MBB",
    companyName: "Ngân hàng TMCP Quân Đội",
    securitiesFirm: "Chứng khoán HSC",
    sector: "Ngân hàng",
    recommendation: "BÁN",
    currentPrice: 20.45,
    targetBuyPrice: "Không khuyến nghị",
    targetSellPrice: 23.3,
    updatedDate: "12/08/2026",
  },
  // Dịch vụ tài chính
  {
    symbol: "SSI",
    companyName: "Công ty Cổ phần Chứng khoán SSI",
    securitiesFirm: "Chứng khoán HSC",
    sector: "Dịch vụ tài chính",
    recommendation: "MUA",
    currentPrice: 25.3,
    targetBuyPrice: "25.3 - 25.9",
    targetSellPrice: 28.9,
    updatedDate: "12/08/2026",
  },
  {
    symbol: "HCM",
    companyName: "Công ty Cổ phần Chứng khoán TP.Hồ Chí Minh",
    securitiesFirm: "Chứng khoán Vietcap",
    sector: "Dịch vụ tài chính",
    recommendation: "MUA",
    currentPrice: 26.15,
    targetBuyPrice: "26.1 - 26.8",
    targetSellPrice: 29.8,
    updatedDate: "12/08/2026",
  },
  // Thép
  {
    symbol: "HPG",
    companyName: "Công ty Cổ phần Tập đoàn Hòa Phát",
    securitiesFirm: "Chứng khoán SSI",
    sector: "Thép",
    recommendation: "MUA",
    currentPrice: 26.5,
    targetBuyPrice: "26.5 - 27.2",
    targetSellPrice: 31.0,
    updatedDate: "12/08/2026",
  },
  {
    symbol: "HSG",
    companyName: "Công ty Cổ phần Tập đoàn Hoa Sen",
    securitiesFirm: "Chứng khoán MBS",
    sector: "Thép",
    recommendation: "MUA",
    currentPrice: 19.5,
    targetBuyPrice: "19.5 - 20.1",
    targetSellPrice: 23.0,
    updatedDate: "12/08/2026",
  },
  // Bất động sản
  {
    symbol: "VIC",
    companyName: "Tập đoàn Vingroup - CTCP",
    securitiesFirm: "Chứng khoán VNDIRECT",
    sector: "Bất động sản",
    recommendation: "MUA",
    currentPrice: 215.5,
    targetBuyPrice: "215.5 - 220.9",
    targetSellPrice: 245.7,
    updatedDate: "12/08/2026",
  },
  {
    symbol: "VHM",
    companyName: "Công ty Cổ phần Vinhomes",
    securitiesFirm: "Chứng khoán Vietcap",
    sector: "Bất động sản",
    recommendation: "MUA",
    currentPrice: 38.5,
    targetBuyPrice: "38.5 - 39.5",
    targetSellPrice: 45.0,
    updatedDate: "12/08/2026",
  },
  // Bán lẻ
  {
    symbol: "FRT",
    companyName: "Công ty Cổ phần Bán lẻ Kỹ thuật số FPT",
    securitiesFirm: "Chứng khoán VNDIRECT",
    sector: "Bán lẻ",
    recommendation: "BÁN",
    currentPrice: 148.0,
    targetBuyPrice: "Không khuyến nghị",
    targetSellPrice: 171.0,
    updatedDate: "12/08/2026",
  },
  {
    symbol: "MWG",
    companyName: "Công ty Cổ phần Đầu tư Thế giới Di Động",
    securitiesFirm: "Chứng khoán HSC",
    sector: "Bán lẻ",
    recommendation: "MUA",
    currentPrice: 55.0,
    targetBuyPrice: "55.0 - 56.5",
    targetSellPrice: 64.0,
    updatedDate: "12/08/2026",
  },
  // Thủy sản
  {
    symbol: "VHC",
    companyName: "Công ty Cổ phần Vĩnh Hoàn",
    securitiesFirm: "Chứng khoán SSI",
    sector: "Thủy sản",
    recommendation: "BÁN",
    currentPrice: 53.1,
    targetBuyPrice: "Không khuyến nghị",
    targetSellPrice: 60.5,
    updatedDate: "12/08/2026",
  },
];
