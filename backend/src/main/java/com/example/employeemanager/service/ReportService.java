package com.example.employeemanager.service;

import com.example.employeemanager.model.Attendance;
import com.example.employeemanager.model.Employee;
import com.example.employeemanager.repository.AttendanceRepository;
import com.example.employeemanager.repository.DepartmentRepository;
import com.example.employeemanager.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class ReportService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final AttendanceRepository attendanceRepository;
    private final com.example.employeemanager.repository.PayrollRepository payrollRepository;

    public ReportService(EmployeeRepository employeeRepository,
                          DepartmentRepository departmentRepository,
                          AttendanceRepository attendanceRepository,
                          com.example.employeemanager.repository.PayrollRepository payrollRepository) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.attendanceRepository = attendanceRepository;
        this.payrollRepository = payrollRepository;
    }

    public Map<String, Object> getSummaryPerformance() {
        List<Employee> employees = employeeRepository.findAll();
        long totalCount = employees.size();
        
        long activeCount = employees.stream().filter(e -> e.getStatus().equalsIgnoreCase("Active")).count();
        long leaveCount = employees.stream().filter(e -> e.getStatus().equalsIgnoreCase("On_Leave") || e.getStatus().equalsIgnoreCase("On Leave")).count();
        long inactiveCount = employees.stream().filter(e -> e.getStatus().equalsIgnoreCase("Inactive")).count();

        Map<String, Object> statusSummary = new HashMap<>();
        statusSummary.put("active", activeCount);
        statusSummary.put("leave", leaveCount);
        statusSummary.put("inactive", inactiveCount);

        List<com.example.employeemanager.model.Department> departments = departmentRepository.findAll();
        List<Map<String, Object>> deptDistribution = new java.util.ArrayList<>();
        for (var dept : departments) {
            long empCount = employees.stream().filter(e -> e.getDepartment().equals(dept.getId())).count();
            double avgSalary = employees.stream().filter(e -> e.getDepartment().equals(dept.getId())).mapToDouble(Employee::getSalary).average().orElse(0.0);
            
            Map<String, Object> deptStats = new HashMap<>();
            deptStats.put("id", dept.getId());
            deptStats.put("name", dept.getName());
            deptStats.put("employeeCount", empCount);
            deptStats.put("averageSalary", avgSalary);
            deptStats.put("budget", dept.getBudget());
            deptDistribution.add(deptStats);
        }

        java.time.LocalDate today = java.time.LocalDate.now();
        List<Attendance> attendanceLogs = attendanceRepository.findAll().stream()
            .filter(a -> a.getDate() != null && a.getDate().equals(today))
            .toList();
        long present = attendanceLogs.stream().filter(a -> a.getStatus().equalsIgnoreCase("Present")).count();
        long absent = attendanceLogs.stream().filter(a -> a.getStatus().equalsIgnoreCase("Absent")).count();
        long leave = attendanceLogs.stream().filter(a -> a.getStatus().equalsIgnoreCase("Leave")).count();
        long late = attendanceLogs.stream().filter(a -> a.getStatus().equalsIgnoreCase("Late")).count();
        
        Map<String, Object> attendanceSummary = new HashMap<>();
        attendanceSummary.put("present", present);
        attendanceSummary.put("absent", absent);
        attendanceSummary.put("leave", leave);
        attendanceSummary.put("late", late);
        attendanceSummary.put("totalTracked", attendanceLogs.size());

        java.util.List<com.example.employeemanager.model.Payroll> payrolls = payrollRepository.findAll();
        double totalPaid = payrolls.stream()
                .filter(p -> "Paid".equalsIgnoreCase(p.getStatus()))
                .mapToDouble(com.example.employeemanager.model.Payroll::getNetSalary)
                .sum();
        double totalPending = payrolls.stream()
                .filter(p -> "Pending".equalsIgnoreCase(p.getStatus()))
                .mapToDouble(com.example.employeemanager.model.Payroll::getNetSalary)
                .sum();

        Map<String, Object> payrollCost = new HashMap<>();
        payrollCost.put("paid", totalPaid);
        payrollCost.put("pending", totalPending);
        payrollCost.put("monthlyAverage", totalPaid + totalPending);

        double avgSalGlobal = employees.stream().mapToDouble(Employee::getSalary).average().orElse(0.0);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalEmployees", totalCount);
        stats.put("statusSummary", statusSummary);
        stats.put("deptDistribution", deptDistribution);
        stats.put("attendanceSummary", attendanceSummary);
        stats.put("payrollCost", payrollCost);
        stats.put("averageSalaryGlobal", avgSalGlobal);

        return stats;
    }
}
